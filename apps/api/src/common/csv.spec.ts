import { describe, it, expect } from "vitest";
import { CsvService } from "./csv.service";

const csv = new CsvService();

describe("CsvService", () => {
  describe("toCSV", () => {
    it("converts objects to CSV", () => {
      const data = [
        { name: "Alice", email: "alice@test.com", age: "30" },
        { name: "Bob", email: "bob@test.com", age: "25" },
      ];
      const result = csv.toCSV(data);
      expect(result).toBe("name,email,age\nAlice,alice@test.com,30\nBob,bob@test.com,25");
    });

    it("escapes commas and quotes", () => {
      const data = [{ name: 'O"Brien', city: "San Francisco, CA" }];
      const result = csv.toCSV(data);
      expect(result).toBe('name,city\n"O""Brien","San Francisco, CA"');
    });

    it("handles empty array", () => {
      expect(csv.toCSV([])).toBe("");
    });
  });

  describe("fromCSV", () => {
    it("parses CSV to objects", () => {
      const input = "name,email\nAlice,alice@test.com\nBob,bob@test.com";
      const result = csv.fromCSV(input);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: "Alice", email: "alice@test.com" });
      expect(result[1]).toEqual({ name: "Bob", email: "bob@test.com" });
    });

    it("handles quoted fields", () => {
      const input = 'name,city\n"O""Brien","San Francisco, CA"';
      const result = csv.fromCSV(input);
      expect(result[0].name).toBe('O"Brien');
      expect(result[0].city).toBe("San Francisco, CA");
    });
  });
});
