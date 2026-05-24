import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "./main.jsx";

describe("Property Hub app", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (path, options = {}) => {
        if (path === "/api/accounts/session/") {
          return jsonResponse({ csrfToken: "test-csrf", user: null });
        }
        if (path === "/api/accounts/login/") {
          const body = JSON.parse(options.body);
          if (body.email === "jane@example.com" && body.password === "pass12345") {
            return jsonResponse({
              user: {
                id: 1,
                email: "jane@example.com",
                fullName: "Jane Otieno",
                role: "buyer",
                isBuyer: true,
                isSeller: false,
                isAdmin: false,
                canPostListings: false,
              },
            });
          }
          if (body.email === "seller@example.com" && body.password === "pass12345") {
            return jsonResponse({
              user: {
                id: 3,
                email: "seller@example.com",
                fullName: "Approved Seller",
                role: "seller",
                isBuyer: false,
                isSeller: true,
                isSellerApproved: true,
                isAdmin: false,
                canPostListings: true,
              },
            });
          }
          if (body.email === "admin@example.com" && body.password === "pass12345") {
            return jsonResponse({
              user: {
                id: 4,
                email: "admin@example.com",
                fullName: "Admin User",
                role: "admin",
                isBuyer: false,
                isSeller: false,
                isAdmin: true,
                canPostListings: true,
              },
            });
          }
          return jsonResponse({ error: "Invalid email or password." }, 400);
        }
        if (path === "/api/accounts/sellers/") {
          return jsonResponse({
            sellers: [
              {
                id: 5,
                fullName: "Pending Seller",
                email: "pending@example.com",
                isSellerApproved: false,
              },
            ],
          });
        }
        if (path === "/api/accounts/sellers/5/approval/") {
          return jsonResponse({
            seller: {
              id: 5,
              fullName: "Pending Seller",
              email: "pending@example.com",
              isSellerApproved: true,
            },
          });
        }
        if (path === "/api/accounts/register/") {
          return jsonResponse({
            user: {
              id: 2,
              email: "new@example.com",
              fullName: "New Seller",
              role: "seller",
              isSeller: true,
              isSellerApproved: false,
              isAdmin: false,
              canPostListings: false,
            },
          }, 201);
        }
        if (path === "/api/accounts/logout/") {
          return jsonResponse({ user: null });
        }
        return jsonResponse({}, 404);
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the marketplace with the default listings", () => {
    render(<App />);

    expect(screen.getByText("PROPERTY HUB")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /discover luxury estates/i })).toBeInTheDocument();
    expect(screen.getByText("The Terraces Luxury Apartment")).toBeInTheDocument();
    expect(screen.getByText("Land Cruiser V8 Horizon Edition")).toBeInTheDocument();
    expect(screen.getByText("High-Capacity Agricultural Milling Plant")).toBeInTheDocument();
  });

  it("filters listings by search text and shows an empty state", () => {
    render(<App />);

    fireEvent.change(screen.getByPlaceholderText(/penthouse, milling machine/i), {
      target: { value: "land cruiser" },
    });

    expect(screen.getByText("Land Cruiser V8 Horizon Edition")).toBeInTheDocument();
    expect(screen.queryByText("The Terraces Luxury Apartment")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/penthouse, milling machine/i), {
      target: { value: "missing item" },
    });

    expect(screen.getByText("No Inventory Discovered")).toBeInTheDocument();
  });

  it("opens the mobile navigation menu and closes it after navigation", () => {
    render(<App />);

    const menuButton = screen.getByRole("button", { name: /toggle menu/i });
    const navigation = screen.getByRole("navigation");

    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(navigation).toHaveClass("open");

    fireEvent.click(screen.getByRole("button", { name: /post listing/i }));

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(navigation).not.toHaveClass("open");
    expect(screen.getByRole("heading", { name: /^login$/i })).toBeInTheDocument();
    expect(screen.getByText(/approved seller account/i)).toBeInTheDocument();
  });

  it("opens login and signup pages from the navigation buttons", () => {
    render(<App />);

    const navigation = screen.getByRole("navigation");

    fireEvent.click(within(navigation).getByRole("button", { name: /^login$/i }));

    expect(screen.getByRole("heading", { name: /^login$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();

    fireEvent.click(within(navigation).getByRole("button", { name: /^sign up$/i }));

    expect(screen.getByRole("heading", { name: /^sign up$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("submits login details to the accounts API and updates the nav user", async () => {
    render(<App />);

    const navigation = screen.getByRole("navigation");
    fireEvent.click(within(navigation).getByRole("button", { name: /^login$/i }));

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "pass12345" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /^login$/i }).at(-1));

    await waitFor(() => {
      expect(screen.getByText("Jane Otieno")).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/accounts/login/",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
  });

  it("changes the post listing form according to the selected item type", async () => {
    render(<App />);

    await loginAs("seller@example.com", "Approved Seller");
    fireEvent.click(screen.getByRole("button", { name: /post listing/i }));

    expect(screen.getByRole("heading", { name: /post property listing/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/bedrooms/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /publish property listing/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /vehicles/i }));

    expect(screen.getByRole("heading", { name: /post vehicle listing/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/mileage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/transmission/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/bedrooms/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /publish vehicles listing/i })).toBeInTheDocument();
  });

  it("shows selected upload filenames on the post listing form", async () => {
    render(<App />);

    await loginAs("seller@example.com", "Approved Seller");
    fireEvent.click(screen.getByRole("button", { name: /post listing/i }));

    const fileInput = document.querySelector("#listing-files");
    const coverPhoto = new File(["image"], "front-view.jpg", { type: "image/jpeg" });

    fireEvent.change(fileInput, {
      target: { files: [coverPhoto] },
    });

    expect(screen.getByText("front-view.jpg")).toBeInTheDocument();
  });

  it("shows admin seller approvals on the admin dashboard", async () => {
    render(<App />);

    await loginAs("admin@example.com", "Admin User");
    fireEvent.click(screen.getByRole("button", { name: /dashboard/i }));

    await waitFor(() => {
      expect(screen.getByText("Pending Seller")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => {
      expect(screen.getByText("Approved")).toBeInTheDocument();
    });
  });

  it("uses the live csrf cookie token for seller approval requests", async () => {
    document.cookie = "csrftoken=live-cookie-token";
    const fetchMock = vi.mocked(global.fetch);

    render(<App />);

    await loginAs("admin@example.com", "Admin User");
    fireEvent.click(screen.getByRole("button", { name: /dashboard/i }));

    await waitFor(() => {
      expect(screen.getByText("Pending Seller")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => {
      expect(screen.getByText("Approved")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/accounts/sellers/5/approval/",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-CSRFToken": "live-cookie-token",
        }),
      })
    );
  });

  it("switches category tabs and opens listing details", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /machinery/i }));

    await waitFor(() => {
      expect(screen.getByText("High-Capacity Agricultural Milling Plant")).toBeInTheDocument();
    });
    expect(screen.queryByText("Land Cruiser V8 Horizon Edition")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("High-Capacity Agricultural Milling Plant"));

    expect(screen.getByRole("heading", { name: "High-Capacity Agricultural Milling Plant" })).toBeInTheDocument();
    expect(screen.getByText(/Premium listing localized in Nakuru/i)).toBeInTheDocument();
  });
});

async function loginAs(email, name) {
  const navigation = screen.getByRole("navigation");
  fireEvent.click(within(navigation).getByRole("button", { name: /^login$/i }));
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: "pass12345" },
  });
  fireEvent.click(screen.getAllByRole("button", { name: /^login$/i }).at(-1));
  await waitFor(() => {
    expect(screen.getByText(name)).toBeInTheDocument();
  });
}

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}
