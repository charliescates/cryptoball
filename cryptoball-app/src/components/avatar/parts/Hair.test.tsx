import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Hair } from "./Hair";

describe("Hair", () => {
  it("renders all hairstyle branches without crashing", () => {
    const { container } = render(
      <svg>
        <Hair faceShape="oval" style="buzz" color="#111" variant={0} />
        <Hair faceShape="oval" style="afro" color="#111" variant={1} />
        <Hair faceShape="oval" style="curly" color="#111" variant={2} />
        <Hair faceShape="oval" style="quiff" color="#111" variant={3} />
        <Hair faceShape="oval" style="waves" color="#111" variant={4} />
        <Hair faceShape="oval" style="locs" color="#111" variant={5} />
        <Hair faceShape="oval" style="mohawk" color="#111" variant={6} />
        <Hair faceShape="oval" style="braids" color="#111" variant={7} />
        <Hair faceShape="oval" style="topknot" color="#111" variant={8} />
        <Hair faceShape="oval" style="flattop" color="#111" variant={9} />
        <Hair faceShape="oval" style="curtains" color="#111" variant={10} />
        <Hair faceShape="oval" style="cornrows" color="#111" variant={11} />
        <Hair faceShape="oval" style="slickback" color="#111" variant={12} />
        <Hair faceShape="oval" style="pompadour" color="#111" variant={13} />
        <Hair faceShape="oval" style="fade" color="#111" variant={14} />
        <Hair faceShape="oval" style="short" color="#111" variant={15} />
      </svg>,
    );

    expect(container.querySelectorAll("path").length).toBeGreaterThan(10);
    expect(container.querySelectorAll("circle").length).toBeGreaterThan(5);
  });
});
