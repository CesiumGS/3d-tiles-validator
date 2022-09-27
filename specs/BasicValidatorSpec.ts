import { BasicValidator } from "../src/validation/BasicValidator";
import { ValidationContext } from "../src/validation/ValidationContext";

import { ResourceResolvers } from "../src/io/ResourceResolvers";

function validateNumberRange(
  value: number,
  min: number | undefined,
  minInclusive: boolean,
  max: number | undefined,
  maxInclusive: boolean
): boolean {
  const resourceResolver = ResourceResolvers.createFileResourceResolver("");
  const context = new ValidationContext(resourceResolver);
  const result = BasicValidator.validateNumberRange(
    "path",
    "name",
    value,
    min,
    minInclusive,
    max,
    maxInclusive,
    context
  );
  //if (context.getResult().length > 0) {
  //  console.log(context.getResult().get(0).message);
  //}
  return result;
}

describe("BasicValidator", function () {
  // Closed range, []
  it("validateNumberRange detects that -5 is NOT in [0,10]", function () {
    const result = validateNumberRange(-5, 0, true, 10, true);
    expect(result).toBeFalse();
  });
  it("validateNumberRange detects that 0 is in [0,10]", function () {
    const result = validateNumberRange(0, 0, true, 10, true);
    expect(result).toBeTrue();
  });
  it("validateNumberRange detects that 5 is in [0,10]", function () {
    const result = validateNumberRange(5, 0, true, 10, true);
    expect(result).toBeTrue();
  });
  it("validateNumberRange detects that 10 is in [0,10]", function () {
    const result = validateNumberRange(10, 0, true, 10, true);
    expect(result).toBeTrue();
  });
  it("validateNumberRange detects that 15 is NOT in [0,10]", function () {
    const result = validateNumberRange(15, 0, true, 10, true);
    expect(result).toBeFalse();
  });

  // Closed range, (]
  it("validateNumberRange detects that -5 is NOT in (0,10]", function () {
    const result = validateNumberRange(-5, 0, false, 10, true);
    expect(result).toBeFalse();
  });
  it("validateNumberRange detects that 0 is NOT in (0,10]", function () {
    const result = validateNumberRange(0, 0, false, 10, true);
    expect(result).toBeFalse();
  });
  it("validateNumberRange detects that 5 is in (0,10]", function () {
    const result = validateNumberRange(5, 0, false, 10, true);
    expect(result).toBeTrue();
  });
  it("validateNumberRange detects that 10 is in (0,10]", function () {
    const result = validateNumberRange(10, 0, false, 10, true);
    expect(result).toBeTrue();
  });
  it("validateNumberRange detects that 15 is NOT in (0,10]", function () {
    const result = validateNumberRange(15, 0, false, 10, true);
    expect(result).toBeFalse();
  });

  // Closed range, [)
  it("validateNumberRange detects that -5 is NOT in [0,10)", function () {
    const result = validateNumberRange(-5, 0, true, 10, false);
    expect(result).toBeFalse();
  });
  it("validateNumberRange detects that 0 is in [0,10)", function () {
    const result = validateNumberRange(0, 0, true, 10, false);
    expect(result).toBeTrue();
  });
  it("validateNumberRange detects that 5 is in [0,10)", function () {
    const result = validateNumberRange(5, 0, true, 10, false);
    expect(result).toBeTrue();
  });
  it("validateNumberRange detects that 10 is NOT in [0,10)", function () {
    const result = validateNumberRange(10, 0, true, 10, false);
    expect(result).toBeFalse();
  });
  it("validateNumberRange detects that 15 is NOT in [0,10)", function () {
    const result = validateNumberRange(15, 0, true, 10, false);
    expect(result).toBeFalse();
  });

  // Closed range, ()
  it("validateNumberRange detects that -5 is NOT in (0,10)", function () {
    const result = validateNumberRange(-5, 0, false, 10, false);
    expect(result).toBeFalse();
  });
  it("validateNumberRange detects that 0 is NOT in (0,10)", function () {
    const result = validateNumberRange(0, 0, false, 10, false);
    expect(result).toBeFalse();
  });
  it("validateNumberRange detects that 5 is in (0,10)", function () {
    const result = validateNumberRange(5, 0, false, 10, false);
    expect(result).toBeTrue();
  });
  it("validateNumberRange detects that 10 is NOT in (0,10)", function () {
    const result = validateNumberRange(10, 0, false, 10, false);
    expect(result).toBeFalse();
  });
  it("validateNumberRange detects that 15 is NOT in (0,10)", function () {
    const result = validateNumberRange(15, 0, false, 10, false);
    expect(result).toBeFalse();
  });

  // Lower bound [
  it("validateNumberRange detects that -5 is NOT in [5,...", function () {
    const result = validateNumberRange(-5, 0, true, undefined, true);
    expect(result).toBeFalse();
  });
  it("validateNumberRange detects that 0 is in [0,...", function () {
    const result = validateNumberRange(0, 0, true, undefined, false);
    expect(result).toBeTrue();
  });
  it("validateNumberRange detects that 5 is in [0,...", function () {
    const result = validateNumberRange(5, 0, true, 10, false);
    expect(result).toBeTrue();
  });

  // Lower bound (
  it("validateNumberRange detects that -5 is NOT in (5,...", function () {
    const result = validateNumberRange(-5, 0, false, undefined, true);
    expect(result).toBeFalse();
  });
  it("validateNumberRange detects that 0 is NOT in (0,...", function () {
    const result = validateNumberRange(0, 0, false, undefined, false);
    expect(result).toBeFalse();
  });
  it("validateNumberRange detects that 5 is in (0,...", function () {
    const result = validateNumberRange(5, 0, false, 10, false);
    expect(result).toBeTrue();
  });

  // Upper bound ]
  it("validateNumberRange detects that 5 is in ...,10]", function () {
    const result = validateNumberRange(5, undefined, true, 10, true);
    expect(result).toBeTrue();
  });
  it("validateNumberRange detects that 10 is in ...,10]", function () {
    const result = validateNumberRange(10, undefined, true, 10, true);
    expect(result).toBeTrue();
  });
  it("validateNumberRange detects that 15 is NOT in ...,10]", function () {
    const result = validateNumberRange(15, undefined, true, 10, true);
    expect(result).toBeFalse();
  });

  // Upper bound )
  it("validateNumberRange detects that 5 is in ...,10)", function () {
    const result = validateNumberRange(5, undefined, true, 10, false);
    expect(result).toBeTrue();
  });
  it("validateNumberRange detects that 10 is NOT in ...,10)", function () {
    const result = validateNumberRange(10, undefined, true, 10, false);
    expect(result).toBeFalse();
  });
  it("validateNumberRange detects that 15 is NOT in ...,10)", function () {
    const result = validateNumberRange(15, undefined, true, 10, false);
    expect(result).toBeFalse();
  });
});
