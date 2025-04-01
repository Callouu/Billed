/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import "@testing-library/jest-dom";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      const iconActivate = windowIcon.classList.contains("active-icon")
      expect(iconActivate).toBeTruthy();

    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("Then there should be 4 bills displayed on the dashboard", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const bill = screen.getAllByTestId("bill");
      const type = screen.getAllByTestId("type");
      const name = screen.getAllByTestId("name");
      const date = screen.getAllByTestId("date");
      const amount = screen.getAllByTestId("amount");
      const status = screen.getAllByTestId("status");
      const iconEye = screen.getAllByTestId("icon-eye");

      expect(bill.length).toBe(4);
      expect(type.length).toBe(4);
      expect(name.length).toBe(4);
      expect(date.length).toBe(4);
      expect(amount.length).toBe(4);
      expect(status.length).toBe(4);
      expect(iconEye.length).toBe(4);
    });
  })

  describe("When I am on Bills Page and I click on New Bill", () => {
    test("Then I should be redirected to NewBill page", () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const onNavigate = jest.fn();
      const bills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      document.body.innerHTML = BillsUI({ data: bills });

      const buttonNewBill = screen.getByRole("button", {
        name: /nouvelle note de frais/i,
      });

      expect(buttonNewBill).toBeTruthy();
      const handleClickNewBill = jest.fn(bills.handleClickNewBill);
      buttonNewBill.addEventListener("click", handleClickNewBill);
      userEvent.click(buttonNewBill);
      expect(handleClickNewBill).toHaveBeenCalled();
    })
  })

  describe("When I click on eye icon", () => {
    test("Then It should open the picture modal", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      const newbills = new Bills({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      });

      document.body.innerHTML = BillsUI({ data: bills });

      $.fn.modal = jest.fn(() => modale.classList.add("show"));
      const iconEye = screen.getAllByTestId("icon-eye");
      const handleClickIconEye = jest.fn(newbills.handleClickIconEye);
      const modale = document.getElementById("modaleFile");

      iconEye.forEach(iconEye => {
        iconEye.addEventListener("click", () => handleClickIconEye(iconEye));
        userEvent.click(iconEye);

        expect(handleClickIconEye).toHaveBeenCalled();
        expect(modale).toHaveClass("show");
      });
    });

    describe("When I went on Bills page and it is loading", () => {
      test("Then, Loading page should be rendered", () => {
        document.body.innerHTML = BillsUI({ loading: true });
        expect(screen.getByText("Loading...")).toBeVisible();
        document.body.innerHTML = "";
      });
    });

    describe("When I am on Bills page but back-end send an error message", () => {
      test("Then, Error page should be rendered", () => {
        document.body.innerHTML = BillsUI({ error: "error message" });
        expect(screen.getByText("Erreur")).toBeVisible();
        document.body.innerHTML = "";
      });
    });

    // describe("When I call the getBills API", () => {
    //   test("Then It should return a list of bills with dates and status", async () => {
    //     Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    //     window.localStorage.setItem('user', JSON.stringify({
    //       type: 'Employee'
    //     }))

    //     const onNavigate = jest.fn();
    //     const bills = new Bills({
    //       document,
    //       onNavigate,
    //       store: mockStore,
    //       localStorage: window.localStorage,
    //     });

    //     const result = await bills.getBills();

    //     expect(result.length).toBe(4);
    //     expect(result[0].status).toBe("En attente");
    //     expect(result[0].date).toBe("4 Avr. 04");
    //   })

    //   test("Then It should return corrupted data with unformatted date", async () => {
    //     Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    //     window.localStorage.setItem('user', JSON.stringify({
    //       type: 'Employee'
    //     }))

    //     const corruptedStore = {
    //       bills() {
    //         return {
    //           list: () =>
    //             Promise.resolve([
    //               { id: "1", date: "invalid-date", status: "pending" },
    //             ]),
    //         };
    //       },
    //     };
    //     const onNavigate = jest.fn();
    //     const bills = new Bills({
    //       document,
    //       onNavigate,
    //       store: corruptedStore,
    //       localStorage: window.localStorage,
    //     });

    //     const result = await bills.getBills();

    //     expect(result.length).toBe(1);
    //     expect(result[0].date).toBe("invalid-date");
    //     expect(result[0].status).toBe("En attente");
    //   })
    // });
  })
  // test d'intégration GET
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API", async () => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      document.body.innerHTML = BillsUI({ data: bills })

      const showBills = await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(showBills).toBeTruthy()
      const billsTableRows = screen.getAllByTestId("bill");
      expect(billsTableRows).toBeTruthy()
      expect(billsTableRows.length).toBe(4);

      const firstBillStatus = billsTableRows[0].querySelector('[data-testid="status"]').textContent;
      expect(firstBillStatus).toBe("pending");
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "a@a"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })

      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      })

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })

        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})
