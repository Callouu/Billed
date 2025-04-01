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

jest.mock("../app/store", () => mockStore)

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
      jest.spyOn(window, 'alert').mockImplementation(() => { });

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'a@a'
      })
      );

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

      fireEvent.change(fileInput, { target: { files: [validFile] } });
      expect(fileInput.files[0].name).toBe("image.jpg");
    });

    test("Then it should reject an invalid file (pdf)", async () => {

      const fileInput = screen.getByTestId("file");
      const invalidFile = new File(["file content"], "document.pdf", {
        type: "application/pdf",
      });

      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      expect(window.alert).toHaveBeenCalledWith(
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

  test("Then it should export file with correct data", async () => {
    document.body.innerHTML = NewBillUI();

    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({
      type: 'Employee',
      email: "a@a"
    })
    );

    const createMock = jest.fn().mockResolvedValue({
      fileUrl: "https://example.com/file.jpg",
      key: "123",
    });
    mockStore.bills = jest.fn(() => ({
      create: createMock,
    }));

    const newBill = new NewBill({
      document,
      onNavigate: jest.fn(),
      store: mockStore,
      localStorage: window.localStorage,
    });

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

    await waitFor(() => expect(createMock).toHaveBeenCalled());
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.any(FormData),
        headers: { noContentType: true },
      })
    );
  });

  describe("When I submit a valid bill form", () => {
    test('then a bill is created', async () => {
      document.body.innerHTML = NewBillUI();

      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({
        type: 'Employee',
        email: "a@a"
      })
      );

      const updateMock = jest.fn().mockResolvedValue({});
      mockStore.bills = jest.fn(() => ({
        update: updateMock,
      }));

      const onNavigate = jest.fn();

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const submit = screen.getByTestId('form-new-bill');

      const validBill = {
        name: "encore",
        date: "2004-04-04",
        type: "Services en ligne",
        amount: 400,
        pct: 20,
        vat: "40",
        commentary: 'séminaire billed',
        fileName: "image.jpg",
        fileUrl: "https://test.storage.tld/image.jpg"
      }

      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      document.querySelector(`input[data-testid="expense-name"]`).value = validBill.name;
      document.querySelector(`input[data-testid="datepicker"]`).value = validBill.date;
      document.querySelector(`select[data-testid="expense-type"]`).value = validBill.type;
      document.querySelector(`input[data-testid="amount"]`).value = validBill.amount;
      document.querySelector(`input[data-testid="vat"]`).value = validBill.vat;
      document.querySelector(`input[data-testid="pct"]`).value = validBill.pct;
      document.querySelector(`textarea[data-testid="commentary"]`).value = validBill.commentary;
      newBill.fileUrl = validBill.fileUrl;
      newBill.fileName = validBill.fileName;
      submit.addEventListener('click', handleSubmit);
      fireEvent.click(submit);
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });
})

// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I submit a valid new bill form", () => {
    test("Then it should create a new bill and redirect to Bills page", async () => {
      const storeSpy = jest.spyOn(mockStore, "bills");
      const bill = {
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl: "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "pending",
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        name: "encore",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2004-04-04",
        amount: 400,
        commentAdmin: "ok",
        email: "a@a",
        pct: 20,
      };

      mockStore.bills = jest.fn(() => ({
        update: jest.fn().mockResolvedValue(bill),
      }));

      const postBills = await mockStore.bills().update(bill);
      expect(storeSpy).toHaveBeenCalledTimes(1);
      expect(postBills).toStrictEqual(bill);
    })
  })

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      document.body.innerHTML = NewBillUI();

      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "employee@test.com" })
      );
    })

    test("Then it should create a new bill but failed with 404 error message", async () => {
      const storeSpy = jest.spyOn(console, "error")

      mockStore.bills = jest.fn(() => ({
        list: jest.fn(() => Promise.resolve([])),
        create: jest.fn(() => Promise.resolve({})),
        update: jest.fn(() => Promise.reject(new Error("404"))),
      }));

      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      await waitFor(() => {
        expect(storeSpy).toHaveBeenCalledWith(new Error("404"));
      });
    })

    test("Then it should create a new bill but failed with 404 error message", async () => {
      const storeSpy = jest.spyOn(console, "error")

      mockStore.bills = jest.fn(() => ({
        list: jest.fn(() => Promise.resolve([])),
        create: jest.fn(() => Promise.resolve({})),
        update: jest.fn(() => Promise.reject(new Error("500"))),
      }));

      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      await waitFor(() => {
        expect(storeSpy).toHaveBeenCalledWith(new Error("500"));
      });
    })
  })
})


