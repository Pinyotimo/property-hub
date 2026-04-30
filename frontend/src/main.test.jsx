import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, waitFor } from "@testing-library/react";

describe("Property Hub app", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    window.history.pushState({}, "", "/app/");
    vi.resetModules();
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
        return jsonResponse({}, 404);
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("loads the public listings route", async () => {
    await import("./main.jsx");

    expect(await screen.findByText("Property Hub")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("No properties found")).toBeInTheDocument();
    });
  });
});

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}
