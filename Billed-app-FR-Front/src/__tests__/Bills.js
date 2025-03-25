/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

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
})
