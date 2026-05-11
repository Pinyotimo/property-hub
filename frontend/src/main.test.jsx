import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import App from "./main.jsx"; // Import the component directly

describe("Property Hub app", () => {
  beforeEach(() => {
    // Reset the URL for the router before each test
    window.history.pushState({}, "", "/app/");
    
    vi.stubGlobal(
      "fetch",
      vi.fn(async (path) => {
        if (path === "/api/accounts/session/") {
          return jsonResponse({ user: null, csrfToken: "test-token" });
        }
        if (path.startsWith("/api/listings/properties/")) {
          return jsonResponse({
            properties: [],
            choices: {
              propertyTypes: [],
              listingTypes: [],
              statuses: [],
            },
          });
        }
        return jsonResponse({ error: "Not found" }, 404);
      })
    );
  });

  afterEach(() => {
    cleanup(); // RTL's cleanup will now automatically unmount <App />
    vi.unstubAllGlobals();
  });

  it("loads the public listings route", async () => {
    // 1. Render the app directly instead of dynamic importing
    render(<App />);

    // 2. Assert initial loading states or permanent UI
    expect(await screen.findByText("Property Hub")).toBeInTheDocument();

    // 3. Wait for the mocked API to resolve and update the UI
    await waitFor(() => {
      expect(screen.getByText("No properties found")).toBeInTheDocument();
    });
  });
});

// Helper function remains exactly the same
function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}