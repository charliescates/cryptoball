import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FootballShirt } from "./FootballShirt";

describe("FootballShirt", () => {
  it("renders the shirt with a clip path and kit variations", () => {
    const { container } = render(
      <svg>
        <FootballShirt
          style="broad"
          primaryKitColor="#123456"
          secondaryKitColor="#ffffff"
          kitStyle="stripe"
          clipId="shirt-clip"
        />
      </svg>,
    );

    expect(container.querySelector("clipPath#shirt-clip")).toBeInTheDocument();
    expect(container.querySelector('rect[width="5"]')).toBeInTheDocument();

    const { container: plainContainer } = render(
      <svg>
        <FootballShirt style="athletic" primaryKitColor="#123456" secondaryKitColor="#ffffff" kitStyle="plain" />
        <FootballShirt style="athletic" primaryKitColor="#123456" secondaryKitColor="#ffffff" kitStyle="sash" />
      </svg>,
    );

    expect(plainContainer.querySelectorAll("path").length).toBeGreaterThan(0);
  });
});
