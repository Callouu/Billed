/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import { ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";
import BillsUI from "../views/BillsUI.js";


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then The icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId('icon-mail')
      const iconActivate = windowIcon.classList.contains("active-icon")
      expect(iconActivate).toBeTruthy();
    })
  })

  describe("When I am on NewBill Page, there are a form", () => {
    test("Then all the form input should be render correctly", () => {
      document.body.innerHTML = NewBillUI();

      const formNewBill = screen.getByTestId("form-new-bill");
      const type = screen.getAllByTestId("expense-type");
      const name = screen.getAllByTestId("expense-name");
      const date = screen.getAllByTestId("datepicker");
      const amount = screen.getAllByTestId("amount");
      const vat = screen.getAllByTestId("vat");
      const pct = screen.getAllByTestId("pct");
      const commentary = screen.getAllByTestId("commentary");
      const file = screen.getAllByTestId("file");
      const submitBtn = document.querySelector("#btn-send-bill");

      expect(formNewBill).toBeTruthy();
      expect(type).toBeTruthy();
      expect(name).toBeTruthy();
      expect(date).toBeTruthy();
      expect(amount).toBeTruthy();
      expect(vat).toBeTruthy();
      expect(pct).toBeTruthy();
      expect(commentary).toBeTruthy();
      expect(file).toBeTruthy();
      expect(submitBtn).toBeTruthy();
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    });
  });
});

describe("Given I am on NewBill Page", () => {
  describe("When I upload a file", () => {
    let newBill;
    beforeEach(() => {
      document.body.innerHTML = NewBillUI();

      // localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'a@a'
      })
      );

      // NewBill instance
      newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });
    });

    test("Then it should accept a valid file (jpg, jpeg, png)", async () => {
      const fileInput = screen.getByTestId("file");
      const validFile = new File(["file content"], "image.jpg", {
        type: "image/jpg",
      });

      // Simulate file selection
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      expect(fileInput.files[0].name).toBe("image.jpg");
    });

    test("Then it should reject an invalid file (pdf)", async () => {
      const fileInput = screen.getByTestId("file");
      const invalidFile = new File(["file content"], "document.pdf", {
        type: "application/pdf",
      });
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => { });

      // Simulate file selection
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      expect(alertMock).toHaveBeenCalledWith(
        "Seuls les fichiers jpg, jpeg et png sont autorisés"
      );
      expect(fileInput.value).toBe("");
    });
  })

  describe("When I submit the form", () => {
    test("Then handleSubmit should be called and updateBill executed", () => {
      document.body.innerHTML = NewBillUI();
      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const updateBillSpy = jest.spyOn(newBill, "updateBill");
      const form = screen.getByTestId("form-new-bill")
      fireEvent.submit(form)
      expect(updateBillSpy).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    })
  })

  describe("When I upload a valid File", () => {
    test("Then it should call store.bills with correct data", async () => {
      // Mock le DOM
      document.body.innerHTML = NewBillUI();

      // Mock localStorage
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({ email: "a@a" })
      );

      // Mock store
      const createMock = jest.fn().mockResolvedValue({
        fileUrl: "https://example.com/file.jpg",
        key: "123",
      });
      mockStore.bills = jest.fn(() => ({
        create: createMock,
      }));

      // Initialise NewBill
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Simule l'upload d'un fichier valide
      const fileInput = screen.getByTestId("file");
      const validFile = new File(["file content"], "image.jpg", {
        type: "image/jpg",
      });
      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await newBill.handleChangeFile({
        preventDefault: jest.fn(),
        target: {
          files: [validFile],
          value: 'image.jpg'
        }
      });

      // Vérifie que createMock a été appelé
      await waitFor(() => expect(createMock).toHaveBeenCalled());
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(FormData),
          headers: { noContentType: true },
        })
      );
    });
  })

  describe("When I upload a file and an error occurs", () => {
    test("Then it should log the error in the console", async () => {
      // Mock le DOM
      document.body.innerHTML = NewBillUI();

      // Mock localStorage
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({ email: "a@a" })
      );

      // Mock store avec une erreur
      const createMock = jest.fn().mockRejectedValue(new Error("Erreur API"));
      mockStore.bills = jest.fn(() => ({
        create: createMock,
      }));

      // Mock console.error
      const consoleErrorMock = jest.spyOn(console, "error").mockImplementation(() => { });

      // Initialise NewBill
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Simule l'upload d'un fichier valide
      const fileInput = screen.getByTestId("file");
      const validFile = new File(["file content"], "image.jpg", {
        type: "image/jpg",
      });
      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await newBill.handleChangeFile({
        preventDefault: jest.fn(),
        target: {
          files: [validFile],
          value: 'image.jpg'
        }
      });

      // Vérifie que createMock a été appelé
      await waitFor(() => expect(createMock).toHaveBeenCalled());
      expect(consoleErrorMock).toHaveBeenCalledWith(new Error("Erreur API"));
      // Nettoyage du mock
      consoleErrorMock.mockRestore();
    });
  })
})


