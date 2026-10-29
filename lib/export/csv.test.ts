import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("writes a BOM, semicolons, decimal commas and CRLF", () => {
    expect(toCsv(["A", "B"], [["x", 3.5]])).toBe("﻿A;B\r\nx;3,5\r\n");
  });

  it("quotes cells containing separators or quotes", () => {
    expect(toCsv(["A"], [['Caja "grande"; 12u']])).toBe('﻿A\r\n"Caja ""grande""; 12u"\r\n');
  });

  it("leaves null cells empty", () => {
    expect(toCsv(["A", "B"], [[null, 1]])).toBe("﻿A;B\r\n;1\r\n");
  });
});
