import React from "react";
import { render, screen } from "@testing-library/react";
import { ModelProvider, useModel, modelOptions, ratePer1k } from "../../app/_components/ModelContext";

describe("ModelProvider context", () => {
  function Consumer() {
    const { model, expert, options, rates, globalModelSelectorEnabled } = useModel();
    return (
      <div>
        <div data-testid="model">{model}</div>
        <div data-testid="expert">{String(expert)}</div>
        <div data-testid="options">{options.join(",")}</div>
        <div data-testid="rates-count">{Object.keys(rates).length}</div>
        <div data-testid="selector-enabled">{String(globalModelSelectorEnabled)}</div>
      </div>
    );
  }

  it("provides defaults and options", () => {
    const { asFragment } = render(
      <ModelProvider>
        <Consumer />
      </ModelProvider>
    );

    expect(screen.getByTestId("model").textContent).toBe("auto");
    expect(screen.getByTestId("expert").textContent).toBe("false");
    const opts = screen.getByTestId("options").textContent?.split(",") ?? [];
    expect(opts).toEqual(modelOptions as unknown as string[]);
    expect(Number(screen.getByTestId("rates-count").textContent)).toBe(Object.keys(ratePer1k).length);
    expect(["true","false"]).toContain(screen.getByTestId("selector-enabled").textContent || "");

    expect(asFragment()).toMatchSnapshot();
  });
});

