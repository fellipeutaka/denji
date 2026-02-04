import { describe, expect, it } from "bun:test";
import {
  getExistingIconNames,
  insertIconAlphabetically,
  parseIconsFile,
  removeIcon,
  replaceIcon,
  toComponentName,
  validateIconName,
} from "./icons";

describe("validateIconName", () => {
  describe("valid formats", () => {
    it("accepts standard icon format", () => {
      const result = validateIconName("mdi:home");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ prefix: "mdi", name: "home" });
      }
    });

    it("accepts hyphenated names", () => {
      const result = validateIconName("lucide:arrow-right");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ prefix: "lucide", name: "arrow-right" });
      }
    });

    it("accepts numeric names", () => {
      const result = validateIconName("svg-spinners:90-ring");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({
          prefix: "svg-spinners",
          name: "90-ring",
        });
      }
    });

    it("accepts complex hyphenated names", () => {
      const result = validateIconName("svg-spinners:90-ring-with-bg");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({
          prefix: "svg-spinners",
          name: "90-ring-with-bg",
        });
      }
    });
  });

  describe("invalid formats", () => {
    it("rejects missing colon", () => {
      const result = validateIconName("mdihome");
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid icon format");
      }
    });

    it("rejects multiple colons", () => {
      const result = validateIconName("mdi:home:extra");
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid icon format");
      }
    });

    it("rejects uppercase prefix", () => {
      const result = validateIconName("MDI:home");
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid prefix");
      }
    });

    it("rejects uppercase name", () => {
      const result = validateIconName("mdi:Home");
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid name");
      }
    });

    it("rejects underscores in prefix", () => {
      const result = validateIconName("my_icons:home");
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid prefix");
      }
    });

    it("rejects empty prefix", () => {
      const result = validateIconName(":home");
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid prefix");
      }
    });

    it("rejects empty name", () => {
      const result = validateIconName("mdi:");
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid name");
      }
    });
  });
});

describe("toComponentName", () => {
  describe("basic transformations", () => {
    it("converts simple name to PascalCase", () => {
      expect(toComponentName("mdi:home")).toBe("Home");
    });

    it("converts hyphenated name to PascalCase", () => {
      expect(toComponentName("lucide:arrow-right")).toBe("ArrowRight");
    });

    it("converts multiple hyphens", () => {
      expect(toComponentName("heroicons:arrow-up-right")).toBe("ArrowUpRight");
    });

    it("handles underscores as separators", () => {
      expect(toComponentName("icons:my_icon_name")).toBe("MyIconName");
    });
  });

  describe("numeric prefix handling", () => {
    it("moves leading number to end", () => {
      expect(toComponentName("svg-spinners:90-ring")).toBe("Ring90");
    });

    it("moves leading number with complex name to end", () => {
      expect(toComponentName("svg-spinners:90-ring-with-bg")).toBe(
        "RingWithBg90"
      );
    });

    it("moves multiple leading numeric segments to end", () => {
      expect(toComponentName("icons:123-456-name")).toBe("Name123456");
    });

    it("handles 180-ring pattern", () => {
      expect(toComponentName("svg-spinners:180-ring")).toBe("Ring180");
    });

    it("handles 270-ring pattern", () => {
      expect(toComponentName("svg-spinners:270-ring")).toBe("Ring270");
    });

    it("handles 3-dots-fade pattern", () => {
      expect(toComponentName("svg-spinners:3-dots-fade")).toBe("DotsFade3");
    });

    it("preserves numbers in middle of name", () => {
      expect(toComponentName("icons:arrow2-right")).toBe("Arrow2Right");
    });

    it("preserves numbers at end of name", () => {
      expect(toComponentName("icons:icon-v2")).toBe("IconV2");
    });
  });

  describe("edge cases", () => {
    it("throws on invalid format without colon", () => {
      expect(() => toComponentName("invalid")).toThrow("Invalid icon format");
    });

    it("throws on empty name after colon", () => {
      expect(() => toComponentName("mdi:")).toThrow("Invalid icon format");
    });

    it("handles single character name", () => {
      expect(toComponentName("icons:x")).toBe("X");
    });

    it("handles consecutive hyphens by filtering empty segments", () => {
      expect(toComponentName("icons:arrow--right")).toBe("ArrowRight");
    });
  });
});

describe("parseIconsFile", () => {
  const emptyIconsFile = `export type IconProps = React.ComponentProps<"svg">;
export type Icon = (props: IconProps) => React.JSX.Element;

export const Icons = {} as const satisfies Record<string, Icon>;
`;

  const singleIconFile = `export type IconProps = React.ComponentProps<"svg">;
export type Icon = (props: IconProps) => React.JSX.Element;

export const Icons = {
  Home: (props) => (<svg {...props}></svg>),
} as const satisfies Record<string, Icon>;
`;

  const multipleIconsFile = `export type IconProps = React.ComponentProps<"svg">;
export type Icon = (props: IconProps) => React.JSX.Element;

export const Icons = {
  ArrowRight: (props) => (<svg {...props}></svg>),
  Check: (props) => (<svg {...props}></svg>),
  Home: (props) => (<svg {...props}></svg>),
} as const satisfies Record<string, Icon>;
`;

  describe("parseIconsFile", () => {
    it("parses empty icons object", () => {
      const result = parseIconsFile(emptyIconsFile);
      expect(result.icons).toEqual([]);
      expect(result.objectStart).toBeGreaterThan(0);
      expect(result.objectEnd).toBeGreaterThanOrEqual(result.objectStart);
    });

    it("parses single icon", () => {
      const result = parseIconsFile(singleIconFile);
      expect(result.icons).toHaveLength(1);
      expect(result.icons[0]?.name).toBe("Home");
    });

    it("parses multiple icons", () => {
      const result = parseIconsFile(multipleIconsFile);
      expect(result.icons).toHaveLength(3);
      expect(result.icons.map((i) => i.name)).toEqual([
        "ArrowRight",
        "Check",
        "Home",
      ]);
    });

    it("includes start and end positions for each icon", () => {
      const result = parseIconsFile(singleIconFile);
      expect(result.icons[0]?.start).toBeGreaterThan(0);
      expect(result.icons[0]?.end).toBeGreaterThan(result.icons[0]?.start ?? 0);
    });
  });

  describe("getExistingIconNames", () => {
    it("returns empty array for empty icons object", () => {
      expect(getExistingIconNames(emptyIconsFile)).toEqual([]);
    });

    it("returns single icon name", () => {
      expect(getExistingIconNames(singleIconFile)).toEqual(["Home"]);
    });

    it("returns all icon names in order", () => {
      expect(getExistingIconNames(multipleIconsFile)).toEqual([
        "ArrowRight",
        "Check",
        "Home",
      ]);
    });
  });
});

describe("insertIconAlphabetically", () => {
  const emptyIconsFile = `export const Icons = {} as const;
`;

  const singleIconFile = `export const Icons = {
  Home: (props) => (<svg {...props}></svg>),
} as const;
`;

  const multipleIconsFile = `export const Icons = {
  ArrowRight: (props) => (<svg {...props}></svg>),
  Check: (props) => (<svg {...props}></svg>),
  Home: (props) => (<svg {...props}></svg>),
} as const;
`;

  const newComponent = "NewIcon: (props) => (<svg {...props}></svg>)";

  it("inserts into empty object", () => {
    const result = insertIconAlphabetically(
      emptyIconsFile,
      "NewIcon",
      newComponent
    );
    expect(result).toContain("NewIcon: (props)");
    expect(getExistingIconNames(result)).toEqual(["NewIcon"]);
  });

  it("inserts before existing icon alphabetically", () => {
    const result = insertIconAlphabetically(
      singleIconFile,
      "Arrow",
      "Arrow: (props) => (<svg {...props}></svg>)"
    );
    const names = getExistingIconNames(result);
    expect(names).toEqual(["Arrow", "Home"]);
  });

  it("inserts after existing icon alphabetically", () => {
    const result = insertIconAlphabetically(
      singleIconFile,
      "Zebra",
      "Zebra: (props) => (<svg {...props}></svg>)"
    );
    const names = getExistingIconNames(result);
    expect(names).toEqual(["Home", "Zebra"]);
  });

  it("inserts in middle of multiple icons", () => {
    const result = insertIconAlphabetically(
      multipleIconsFile,
      "Bell",
      "Bell: (props) => (<svg {...props}></svg>)"
    );
    const names = getExistingIconNames(result);
    expect(names).toEqual(["ArrowRight", "Bell", "Check", "Home"]);
  });

  it("inserts at beginning of multiple icons", () => {
    const result = insertIconAlphabetically(
      multipleIconsFile,
      "Alert",
      "Alert: (props) => (<svg {...props}></svg>)"
    );
    const names = getExistingIconNames(result);
    expect(names).toEqual(["Alert", "ArrowRight", "Check", "Home"]);
  });

  it("inserts at end of multiple icons", () => {
    const result = insertIconAlphabetically(
      multipleIconsFile,
      "Zebra",
      "Zebra: (props) => (<svg {...props}></svg>)"
    );
    const names = getExistingIconNames(result);
    expect(names).toEqual(["ArrowRight", "Check", "Home", "Zebra"]);
  });
});

describe("replaceIcon", () => {
  const iconsFile = `export const Icons = {
  Home: (props) => (<svg old="true" {...props}></svg>),
} as const;
`;

  it("replaces existing icon", () => {
    const newComponent = 'Home: (props) => (<svg new="true" {...props}></svg>)';
    const result = replaceIcon(iconsFile, "Home", newComponent);
    expect(result).toContain('new="true"');
    expect(result).not.toContain('old="true"');
  });

  it("returns unchanged content if icon not found", () => {
    const newComponent = "Other: (props) => (<svg {...props}></svg>)";
    const result = replaceIcon(iconsFile, "NotFound", newComponent);
    expect(result).toBe(iconsFile);
  });

  it("preserves other icons when replacing", () => {
    const multiFile = `export const Icons = {
  Arrow: (props) => (<svg {...props}></svg>),
  Home: (props) => (<svg old="true" {...props}></svg>),
  Check: (props) => (<svg {...props}></svg>),
} as const;
`;
    const newComponent = 'Home: (props) => (<svg new="true" {...props}></svg>)';
    const result = replaceIcon(multiFile, "Home", newComponent);
    const names = getExistingIconNames(result);
    expect(names).toEqual(["Arrow", "Home", "Check"]);
    expect(result).toContain('new="true"');
  });
});

describe("removeIcon", () => {
  const singleIconFile = `export const Icons = {
  Home: (props) => (<svg {...props}></svg>),
} as const;
`;

  const twoIconsFile = `export const Icons = {
  Arrow: (props) => (<svg {...props}></svg>),
  Home: (props) => (<svg {...props}></svg>),
} as const;
`;

  const threeIconsFile = `export const Icons = {
  Arrow: (props) => (<svg {...props}></svg>),
  Home: (props) => (<svg {...props}></svg>),
  Check: (props) => (<svg {...props}></svg>),
} as const;
`;

  it("removes only icon leaving empty object", () => {
    const result = removeIcon(singleIconFile, "Home");
    expect(getExistingIconNames(result)).toEqual([]);
  });

  it("removes first icon of two", () => {
    const result = removeIcon(twoIconsFile, "Arrow");
    expect(getExistingIconNames(result)).toEqual(["Home"]);
  });

  it("removes last icon of two", () => {
    const result = removeIcon(twoIconsFile, "Home");
    expect(getExistingIconNames(result)).toEqual(["Arrow"]);
  });

  it("removes first icon of three", () => {
    const result = removeIcon(threeIconsFile, "Arrow");
    expect(getExistingIconNames(result)).toEqual(["Home", "Check"]);
  });

  it("removes middle icon of three", () => {
    const result = removeIcon(threeIconsFile, "Home");
    expect(getExistingIconNames(result)).toEqual(["Arrow", "Check"]);
  });

  it("removes last icon of three", () => {
    const result = removeIcon(threeIconsFile, "Check");
    expect(getExistingIconNames(result)).toEqual(["Arrow", "Home"]);
  });

  it("returns unchanged content if icon not found", () => {
    const result = removeIcon(singleIconFile, "NotFound");
    expect(result).toBe(singleIconFile);
  });
});
