import { TechniqueId } from "@/lib/types/sudoku_technique_types";

export type TechniqueCaseBase = {
  name: string;
  techniqueId: TechniqueId;
  /** `placeDigit` の正誤同期用。未指定なら論理確定のみ。 */
  solution81?: string;
  input: {
    values81: string;
    candidateMasks81: number[];
  };
  expected: {
    values81: string;
    candidateMasks81: number[];
  } | null;
};

/**
 * ユーザーが用意する盤面（入力）と期待結果（確定セル）。
 *
 * ここを埋めるだけで、technique のユニットテストが回るようにしてあります。
 */
export const TECHNIQUE_CASES: TechniqueCaseBase[] = [
  {
    name: "fullHouse 1",
    techniqueId: TechniqueId.FULL_HOUSE,
    input: {
      values81:
        "123456780000000000000000000000000000000000000000000000000000000000000000000000000",
      candidateMasks81: new Array(81).fill(0),
    },
    expected: {
      values81:
        "123456789000000000000000000000000000000000000000000000000000000000000000000000000",
      candidateMasks81: new Array(81).fill(0),
    },
  },
  {
    name: "fullHouse 2",
    techniqueId: TechniqueId.FULL_HOUSE,
    input: {
      values81:
        "123000000456000000780000000000000000000000000000000000000000000000000000000000000",
      candidateMasks81: new Array(81).fill(0),
    },
    expected: {
      values81:
        "123000000456000000789000000000000000000000000000000000000000000000000000000000000",
      candidateMasks81: new Array(81).fill(0),
    },
  },
  {
    name: "fullHouse 3",
    techniqueId: TechniqueId.FULL_HOUSE,
    input: {
      values81:
        "100000000200000000300000000400000000500000000600000000700000000800000000000000000",
      candidateMasks81: new Array(81).fill(0),
    },
    expected: {
      values81:
        "100000000200000000300000000400000000500000000600000000700000000800000000900000000",
      candidateMasks81: new Array(81).fill(0),
    },
  },
  {
    name: "single 1",
    techniqueId: TechniqueId.SINGLE,
    input: {
      values81:
        "008007900042005000000600050003006801000000006900070000080130470000090000010000000",
      candidateMasks81: new Array(81).fill(0),
    },
    expected: {
      values81:
        "008007900042005000000600050003006801000000006900070000080132470000090000010000000",
      candidateMasks81: new Array(81).fill(0),
    },
  },
  {
    name: "memoSingle 1",
    techniqueId: TechniqueId.MEMO_SINGLE,
    input: {
      values81:
        "008007900042005000000600050003006801000000006900070000080130470000090000010000000",
      candidateMasks81: Array.from({ length: 81 }, (_, i) => (i === 59 ? 2 : 0)),
    },
    expected: {
      values81:
        "008007900042005000000600050003006801000000006900070000080132470000090000010000000",
      candidateMasks81: new Array(81).fill(0),
    },
  },
  {
    name: "hiddenSingle 1",
    techniqueId: TechniqueId.HIDDEN_SINGLE,
    input: {
      values81:
        "760000012500007409084100600030806200000000000002904050003002940106300007290000083",
      candidateMasks81: new Array(81).fill(0),
    },
    expected: {
      values81:
        "760000012520087409384120670030806200008000000002904050003002940146300027290000083",
      candidateMasks81: new Array(81).fill(0),
    },
  },
  {
    name: "pencilMark 1",
    techniqueId: TechniqueId.PENCIL_MARK,
    input: {
      values81:
        "005060008004007000000203000000030024000000900237040100140008060008001000000050003",
      candidateMasks81: new Array(81).fill(0),
    },
    expected: {
      values81:
        "005060008004007000000203000000030024000000900237040100140008060008001000000050003",
      candidateMasks81: [
        324, 323, 0, 265, 0, 264, 78, 333, 0, 420, 419, 0, 401, 385, 0, 54, 277,
        307, 480, 481, 289, 0, 385, 0, 120, 345, 369, 432, 433, 289, 497, 0,
        304, 240, 0, 0, 184, 177, 33, 241, 195, 50, 0, 212, 112, 0, 0, 0, 432,
        0, 304, 0, 144, 48, 0, 0, 262, 324, 322, 0, 82, 0, 338, 372, 370, 0,
        364, 322, 0, 90, 344, 338, 352, 354, 290, 360, 0, 298, 202, 457, 0,
      ],
    },
  },

  {
    name: "pointing 1",
    techniqueId: TechniqueId.POINTING,
    input: {
      values81:
        "000001340368050200000030870639200700780006000050090600800000000000070100043160987",
      candidateMasks81: [
        274, 322, 82, 480, 130, 0, 0, 0, 304, 0, 0, 0, 328, 0, 328, 0, 257, 257,
        283, 259, 27, 296, 0, 266, 0, 0, 305, 0, 0, 0, 0, 137, 152, 0, 17, 153,
        0, 0, 11, 28, 9, 0, 24, 279, 287, 11, 0, 11, 204, 0, 204, 0, 7, 143, 0,
        323, 115, 284, 10, 286, 24, 54, 62, 274, 258, 50, 412, 0, 414, 0, 54,
        62, 18, 0, 0, 0, 0, 18, 0, 0, 0,
      ],
    },
    expected: {
      values81:
        "000001340368050200000030870639200700780006000050090600800000000000070100043160987",
      candidateMasks81: [
        274, 322, 82, 480, 130, 0, 0, 0, 304, 0, 0, 0, 328, 0, 328, 0, 257, 257,
        283, 259, 27, 296, 0, 266, 0, 0, 304, 0, 0, 0, 0, 137, 152, 0, 17, 153,
        0, 0, 11, 28, 9, 0, 24, 279, 287, 11, 0, 11, 204, 0, 204, 0, 7, 143, 0,
        323, 115, 284, 10, 286, 24, 54, 62, 274, 258, 50, 412, 0, 414, 0, 54,
        62, 18, 0, 0, 0, 0, 18, 0, 0, 0,
      ],
    },
  },
  {
    name: "boxLineReduction 1",
    techniqueId: TechniqueId.BOX_LINE_REDUCTION,
    input: {
      values81:
        "063000895090503467475698312000809200000735901900002003009380120001000509000951008",
      candidateMasks81: [
        3, 0, 0, 11, 75, 72, 0, 0, 0, 131, 0, 130, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 117, 29, 104, 0, 41, 0, 0, 88, 40, 162, 138, 170, 0, 0,
        0, 0, 136, 0, 0, 153, 232, 9, 41, 0, 96, 216, 0, 112, 24, 0, 0, 0, 104,
        0, 0, 40, 230, 142, 0, 10, 106, 104, 0, 76, 0, 102, 14, 106, 0, 0, 0,
        96, 76, 0,
      ],
    },
    expected: {
      values81:
        "063000895090503467475698312000809200000735901900002003009380120001000509000951008",
      candidateMasks81: [
        3, 0, 0, 11, 75, 72, 0, 0, 0, 131, 0, 130, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 85, 29, 72, 0, 41, 0, 0, 88, 40, 162, 138, 170, 0, 0, 0,
        0, 136, 0, 0, 153, 200, 9, 41, 0, 96, 216, 0, 112, 24, 0, 0, 0, 104, 0,
        0, 40, 230, 142, 0, 10, 106, 104, 0, 76, 0, 102, 14, 106, 0, 0, 0, 96,
        76, 0,
      ],
    },
  },

  {
    name: "pair 1 (solver case 1 / after pencil)",
    techniqueId: TechniqueId.PAIR,
    input: {
      values81:
        "800100000603020000090700000020000006004009100010080409032006040005000000000402750",
      candidateMasks81: [
        0, 88, 64, 0, 316, 28, 310, 358, 94, 0, 88, 0, 400, 0, 152, 400, 449, 217,
        27, 0, 1, 0, 60, 156, 182, 167, 159, 340, 0, 448, 20, 93, 93, 148, 196, 0,
        84, 240, 0, 54, 116, 0, 0, 198, 214, 84, 0, 96, 54, 0, 84, 0, 70, 0, 321,
        0, 0, 400, 337, 0, 384, 0, 129, 329, 232, 0, 388, 325, 197, 422, 423, 135,
        257, 160, 417, 0, 261, 0, 0, 0, 133,
      ],
    },
    expected: {
      values81:
        "800100000603020000090700000020000006004009100010080409032006040005000000000402750",
      candidateMasks81: [
        0, 88, 64, 0, 316, 28, 310, 358, 94, 0, 88, 0, 400, 0, 152, 400, 449, 217,
        27, 0, 1, 0, 60, 156, 182, 167, 159, 340, 0, 384, 20, 93, 93, 148, 196, 0,
        84, 240, 0, 54, 116, 0, 0, 198, 214, 84, 0, 32, 54, 0, 84, 0, 70, 0, 321,
        0, 0, 400, 337, 0, 384, 0, 129, 329, 232, 0, 388, 325, 197, 422, 423, 135,
        257, 160, 416, 0, 261, 0, 0, 0, 133,
      ],
    },
  },
  {
    name: "triple 1 (solver case 1 / after pencil)",
    techniqueId: TechniqueId.TRIPLE,
    input: {
      values81:
        "800100000603020000090700000020000006004009100010080409032006040005000000000402750",
      candidateMasks81: [
        0, 88, 64, 0, 316, 28, 310, 358, 94, 0, 88, 0, 400, 0, 152, 400, 449, 217,
        27, 0, 1, 0, 60, 156, 182, 167, 159, 340, 0, 448, 20, 93, 93, 148, 196, 0,
        84, 240, 0, 54, 116, 0, 0, 198, 214, 84, 0, 96, 54, 0, 84, 0, 70, 0, 321,
        0, 0, 400, 337, 0, 384, 0, 129, 329, 232, 0, 388, 325, 197, 422, 423, 135,
        257, 160, 417, 0, 261, 0, 0, 0, 133,
      ],
    },
    expected: {
      values81:
        "800100000603020000090700000020000006004009100010080409032006040005000000000402750",
      candidateMasks81: [
        0, 88, 64, 0, 316, 28, 310, 358, 94, 0, 88, 0, 400, 0, 152, 400, 449, 217,
        27, 0, 1, 0, 60, 156, 182, 167, 159, 340, 0, 384, 20, 93, 93, 148, 196, 0,
        84, 240, 0, 54, 116, 0, 0, 198, 214, 84, 0, 96, 54, 0, 84, 0, 70, 0, 321,
        0, 0, 400, 337, 0, 384, 0, 129, 329, 232, 0, 388, 325, 197, 422, 423, 135,
        257, 160, 384, 0, 261, 0, 0, 0, 133,
      ],
    },
  },
  {
    name: "quad 1 (solver case 1 / after pencil)",
    techniqueId: TechniqueId.QUAD,
    input: {
      values81:
        "800100000603020000090700000020000006004009100010080409032006040005000000000402750",
      candidateMasks81: [
        0, 88, 64, 0, 316, 28, 310, 358, 94, 0, 88, 0, 400, 0, 152, 400, 449, 217,
        27, 0, 1, 0, 60, 156, 182, 167, 159, 340, 0, 448, 20, 93, 93, 148, 196, 0,
        84, 240, 0, 54, 116, 0, 0, 198, 214, 84, 0, 96, 54, 0, 84, 0, 70, 0, 321,
        0, 0, 400, 337, 0, 384, 0, 129, 329, 232, 0, 388, 325, 197, 422, 423, 135,
        257, 160, 417, 0, 261, 0, 0, 0, 133,
      ],
    },
    expected: {
      values81:
        "800100000603020000090700000020000006004009100010080409032006040005000000000402750",
      candidateMasks81: [
        0, 88, 64, 0, 316, 28, 310, 358, 94, 0, 88, 0, 400, 0, 152, 400, 449, 217,
        27, 0, 1, 0, 60, 156, 182, 167, 159, 340, 0, 448, 20, 93, 93, 148, 196, 0,
        84, 240, 0, 34, 116, 0, 0, 198, 214, 84, 0, 96, 34, 0, 84, 0, 70, 0, 321,
        0, 0, 400, 337, 0, 384, 0, 129, 329, 232, 0, 388, 325, 197, 422, 423, 135,
        257, 160, 417, 0, 261, 0, 0, 0, 133,
      ],
    },
  },

  {
    name: "hiddenPair 1 (solver case 1 / after pencil)",
    techniqueId: TechniqueId.HIDDEN_PAIR,
    input: {
      values81:
        "800100000603020000090700000020000006004009100010080409032006040005000000000402750",
      candidateMasks81: [
        0, 88, 64, 0, 316, 28, 310, 358, 94, 0, 88, 0, 400, 0, 152, 400, 449, 217,
        27, 0, 1, 0, 60, 156, 182, 167, 159, 340, 0, 448, 20, 93, 93, 148, 196, 0,
        84, 240, 0, 54, 116, 0, 0, 198, 214, 84, 0, 96, 54, 0, 84, 0, 70, 0, 321,
        0, 0, 400, 337, 0, 384, 0, 129, 329, 232, 0, 388, 325, 197, 422, 423, 135,
        257, 160, 417, 0, 261, 0, 0, 0, 133,
      ],
    },
    expected: {
      values81:
        "800100000603020000090700000020000006004009100010080409032006040005000000000402750",
      candidateMasks81: [
        0, 88, 64, 0, 316, 28, 310, 358, 94, 0, 88, 0, 400, 0, 152, 400, 449, 217,
        27, 0, 1, 0, 60, 156, 182, 167, 159, 340, 0, 448, 20, 9, 9, 148, 196, 0,
        84, 240, 0, 54, 116, 0, 0, 198, 214, 84, 0, 96, 54, 0, 84, 0, 70, 0, 321,
        0, 0, 400, 337, 0, 384, 0, 129, 329, 232, 0, 388, 325, 197, 422, 423, 135,
        257, 160, 417, 0, 261, 0, 0, 0, 133,
      ],
    },
  },
  {
    name: "hiddenTriple 1 (solver case 1 / after pencil)",
    techniqueId: TechniqueId.HIDDEN_TRIPLE,
    input: {
      values81:
        "800100000603020000090700000020000006004009100010080409032006040005000000000402750",
      candidateMasks81: [
        0, 88, 64, 0, 316, 28, 310, 358, 94, 0, 88, 0, 400, 0, 152, 400, 449, 217,
        27, 0, 1, 0, 60, 156, 182, 167, 159, 340, 0, 448, 20, 93, 93, 148, 196, 0,
        84, 240, 0, 54, 116, 0, 0, 198, 214, 84, 0, 96, 54, 0, 84, 0, 70, 0, 321,
        0, 0, 400, 337, 0, 384, 0, 129, 329, 232, 0, 388, 325, 197, 422, 423, 135,
        257, 160, 417, 0, 261, 0, 0, 0, 133,
      ],
    },
    expected: {
      values81:
        "800100000603020000090700000020000006004009100010080409032006040005000000000402750",
      candidateMasks81: [
        0, 88, 64, 0, 316, 28, 310, 358, 94, 0, 88, 0, 400, 0, 152, 400, 449, 217,
        27, 0, 1, 0, 60, 156, 182, 167, 159, 340, 0, 384, 20, 93, 93, 148, 196, 0,
        84, 240, 0, 54, 116, 0, 0, 198, 214, 84, 0, 96, 54, 0, 84, 0, 70, 0, 321,
        0, 0, 400, 337, 0, 384, 0, 129, 329, 232, 0, 388, 325, 197, 422, 423, 135,
        257, 160, 385, 0, 261, 0, 0, 0, 133,
      ],
    },
  },
  {
    name: "hiddenQuad 1 (solver case 1 / after pencil)",
    techniqueId: TechniqueId.HIDDEN_QUAD,
    input: {
      values81:
        "800100000603020000090700000020000006004009100010080409032006040005000000000402750",
      candidateMasks81: [
        0, 88, 64, 0, 316, 28, 310, 358, 94, 0, 88, 0, 400, 0, 152, 400, 449, 217,
        27, 0, 1, 0, 60, 156, 182, 167, 159, 340, 0, 448, 20, 93, 93, 148, 196, 0,
        84, 240, 0, 54, 116, 0, 0, 198, 214, 84, 0, 96, 54, 0, 84, 0, 70, 0, 321,
        0, 0, 400, 337, 0, 384, 0, 129, 329, 232, 0, 388, 325, 197, 422, 423, 135,
        257, 160, 417, 0, 261, 0, 0, 0, 133,
      ],
    },
    expected: {
      values81:
        "800100000603020000090700000020000006004009100010080409032006040005000000000402750",
      candidateMasks81: [
        0, 88, 64, 0, 316, 28, 310, 358, 94, 0, 88, 0, 400, 0, 152, 400, 449, 217,
        27, 0, 1, 0, 60, 156, 182, 167, 159, 340, 0, 384, 20, 93, 93, 148, 196, 0,
        84, 240, 0, 54, 116, 0, 0, 198, 214, 84, 0, 32, 54, 0, 84, 0, 70, 0, 321,
        0, 0, 400, 337, 0, 384, 0, 129, 329, 232, 0, 388, 325, 197, 422, 423, 135,
        257, 160, 417, 0, 261, 0, 0, 0, 133,
      ],
    },
  },

  // fish: SudokuWiki「From the Start」例にペンシルマーク適用後の memos（同サイト X-Wing / Swordfish / Jellyfish 解説）
  {
    name: "fish22 1 (SudokuWiki X-Wing / after pencil)",
    techniqueId: TechniqueId.FISH_22,
    input: {
      values81:
        "000000004760010050090002081070050010000709000080030060240100070010090045900000000",
      candidateMasks81: [
        149, 22, 151, 436, 224, 244, 358, 262, 0, 0, 0, 142, 396, 0, 140, 262, 0, 262,
        28, 0, 28, 60, 104, 0, 100, 0, 0, 44, 0, 302, 170, 0, 168, 398, 0, 390, 61,
        22, 63, 0, 170, 0, 158, 6, 134, 25, 0, 283, 10, 0, 9, 346, 0, 322, 0, 0, 180,
        0, 160, 180, 420, 0, 420, 164, 0, 228, 166, 0, 228, 166, 0, 0, 0, 20, 244, 190,
        234, 252, 167, 6, 166,
      ],
    },
    expected: {
      values81:
        "000000004760010050090002081070050010000709000080030060240100070010090045900000000",
      candidateMasks81: [
        149, 22, 151, 436, 224, 244, 358, 262, 0, 0, 0, 142, 396, 0, 140, 262, 0, 262,
        28, 0, 28, 60, 104, 0, 100, 0, 0, 44, 0, 302, 170, 0, 168, 398, 0, 390, 61,
        22, 63, 0, 170, 0, 158, 6, 134, 24, 0, 282, 10, 0, 9, 346, 0, 322, 0, 0, 180,
        0, 160, 180, 420, 0, 420, 164, 0, 228, 166, 0, 228, 166, 0, 0, 0, 20, 244, 190,
        234, 252, 167, 6, 166,
      ],
    },
  },
  {
    name: "skyscraper 1 (synthetic / digit 9 rows 0–1; roofs (0,0)(1,2); elim block 0 except floors/roofs)",
    techniqueId: TechniqueId.SKYSCRAPER,
    input: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const no9 = 511 - 256;
        if (r === 0 && (c === 0 || c === 1)) return 511;
        if (r === 0) return no9;
        if (r === 1 && (c === 1 || c === 2)) return 511;
        if (r === 1) return no9;
        return 511;
      }),
    },
    expected: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const no9 = 511 - 256;
        if (r === 0 && (c === 0 || c === 1)) return 511;
        if (r === 0) return no9;
        if (r === 1 && (c === 1 || c === 2)) return 511;
        if (r === 1) return no9;
        if (i === 18 || i === 19 || i === 20) return no9;
        return 511;
      }),
    },
  },
  {
    name: "twoStringKite 1 (synthetic / digit 9; row0 + col2, elim at r4c4)",
    techniqueId: TechniqueId.TWO_STRING_KITE,
    input: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const no9 = 511 - 256;

        if (r === 0 && (c === 0 || c === 4)) return 511; // row strong link
        if (c === 2 && (r === 1 || r === 4)) return 511; // column strong link
        if (r === 4 && c === 4) return 511; // sees both kite ends
        return no9;
      }),
    },
    expected: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const no9 = 511 - 256;

        if (r === 0 && (c === 0 || c === 4)) return 511;
        if (c === 2 && (r === 1 || r === 4)) return 511;
        if (r === 4 && c === 4) return no9;
        return no9;
      }),
    },
  },
  {
    name: "turboFish 1 (synthetic / generalized strong-weak-strong with block)",
    techniqueId: TechniqueId.TURBO_FISH,
    input: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const no9 = 511 - 256;

        if (r === 0 && (c === 0 || c === 4)) return 511; // row strong link
        if ((r === 3 && c === 3) || (r === 4 && c === 4)) return 511; // block strong link
        if (r === 3 && c === 0) return 511; // candidate affected by another chain in this layout
        return no9;
      }),
    },
    expected: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const no9 = 511 - 256;

        if (r === 0 && (c === 0 || c === 4)) return 511;
        if (r === 3 && c === 3) return 511;
        if (r === 4 && c === 4) return no9;
        if (r === 3 && c === 0) return 511;
        return no9;
      }),
    },
  },
  {
    name: "xyWing 1 (synthetic / pivot r0c0, wings r0c4 & r4c0, elim r4c4:3)",
    techniqueId: TechniqueId.XY_WING,
    input: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const no3 = 511 - 4;
        if (r === 0 && c === 0) return 3; // {1,2}
        if (r === 0 && c === 4) return 5; // {1,3}
        if (r === 4 && c === 0) return 6; // {2,3}
        if (r === 4 && c === 4) return 511; // sees both wings
        return no3;
      }),
    },
    expected: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const no3 = 511 - 4;
        if (r === 0 && c === 0) return 3;
        if (r === 0 && c === 4) return 5;
        if (r === 4 && c === 0) return 6;
        if (r === 4 && c === 4) return no3;
        return no3;
      }),
    },
  },
  {
    name: "xyzWing 1 (synthetic / pivot r1c1, wings in same block, elim r2c2:3)",
    techniqueId: TechniqueId.XYZ_WING,
    input: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const no3 = 511 - 4;
        if (r === 1 && c === 1) return 7; // {1,2,3}
        if (r === 1 && c === 2) return 5; // {1,3}
        if (r === 2 && c === 1) return 6; // {2,3}
        if (r === 2 && c === 2) return 511; // sees pivot + both wings
        return no3;
      }),
    },
    expected: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const no3 = 511 - 4;
        if (r === 1 && c === 1) return 7;
        if (r === 1 && c === 2) return 5;
        if (r === 2 && c === 1) return 6;
        if (r === 2 && c === 2) return no3;
        return no3;
      }),
    },
  },
  {
    name: "wxyzWing 1 (synthetic / ALS in block0, elim r1c4:4)",
    techniqueId: TechniqueId.WXYZ_WING,
    input: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const no4 = 511 - 8;
        if (r === 0 && c === 0) return 3; // {1,2}
        if (r === 0 && c === 1) return 5; // {1,3} -> restricted candidate 1 in row0
        if (r === 1 && c === 0) return 8; // {4}
        if (r === 1 && c === 1) return 8; // {4}
        if (r === 1 && c === 4) return 511; // sees both {2,4}/{3,4} cells (row1)
        return no4;
      }),
    },
    expected: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const no4 = 511 - 8;
        if (r === 0 && c === 0) return 3;
        if (r === 0 && c === 1) return 5;
        if (r === 1 && c === 0) return 8;
        if (r === 1 && c === 1) return 8;
        if (r === 1 && c === 4) return no4;
        return no4;
      }),
    },
  },
  {
    name: "wWing 1 (synthetic / pair {1,2}, strong-link on 1 in col2, elim r0c4:2)",
    techniqueId: TechniqueId.W_WING,
    input: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        if (r === 0 && c === 0) return 3; // A {1,2}
        if (r === 4 && c === 4) return 3; // B {1,2}
        if (r === 0 && c === 2) return 5; // C {1,3} (sees A)
        if (r === 4 && c === 2) return 9; // D {1,4} (sees B)
        if (r === 0 && c === 4) return 511; // sees A and B, candidate 2 removed
        return 508; // no 1,2 by default
      }),
    },
    expected: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        if (r === 0 && c === 0) return 3;
        if (r === 4 && c === 4) return 3;
        if (r === 0 && c === 2) return 5;
        if (r === 4 && c === 2) return 9;
        if (r === 0 && c === 4) return 509;
        return 508;
      }),
    },
  },
  {
    name: "uniqueRectangle 1 (synthetic / type1, remove {1,2} from r1c4)",
    techniqueId: TechniqueId.UNIQUE_RECTANGLE,
    input: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        if (r === 0 && c === 0) return 3; // {1,2}
        if (r === 0 && c === 4) return 3; // {1,2}
        if (r === 1 && c === 0) return 3; // {1,2}
        if (r === 1 && c === 4) return 7; // {1,2,3} target
        return 508; // default no 1/2
      }),
    },
    expected: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        if (r === 0 && c === 0) return 3;
        if (r === 0 && c === 4) return 3;
        if (r === 1 && c === 0) return 3;
        if (r === 1 && c === 4) return 4; // {3}
        return 508;
      }),
    },
  },
  {
    name: "bugPlus1 1 (synthetic / one tri-value cell, keep digit 3 at r0c0)",
    techniqueId: TechniqueId.BUG_PLUS_1,
    input: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        if (r === 0 && c === 0) return 7; // {1,2,3} bug cell
        if (r === 0 && c === 4) return 5; // {1,3}
        if (r === 0 && c === 8) return 6; // {2,3}
        if (r === 4 && c === 0) return 5; // {1,3}
        if (r === 8 && c === 0) return 6; // {2,3}
        if (r === 1 && c === 1) return 5; // {1,3}
        if (r === 2 && c === 2) return 6; // {2,3}
        return 3; // default {1,2} (bivalue)
      }),
    },
    expected: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        if (r === 0 && c === 0) return 4; // {3}
        if (r === 0 && c === 4) return 5;
        if (r === 0 && c === 8) return 6;
        if (r === 4 && c === 0) return 5;
        if (r === 8 && c === 0) return 6;
        if (r === 1 && c === 1) return 5;
        if (r === 2 && c === 2) return 6;
        return 3;
      }),
    },
  },
  {
    name: "xChain 1 (synthetic / S-W-S-W-S on digit9, elim r1c1:9)",
    techniqueId: TechniqueId.X_CHAIN,
    input: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        if (r === 0 && c === 1) return 257; // A {1,9}
        if (r === 0 && c === 5) return 272; // B {5,9}  strong with A (row0)
        if (r === 4 && c === 5) return 288; // C {6,9}  weak with B (col5)
        if (r === 4 && c === 7) return 320; // D {7,9}  strong with C (row4)
        if (r === 2 && c === 7) return 384; // E {8,9}  weak with D (col7)
        if (r === 2 && c === 2) return 258; // F {2,9}  strong with E (row2)
        if (r === 8 && c === 5) return 260; // make col5 weak (not strong)
        if (r === 7 && c === 7) return 264; // make col7 weak (not strong)
        if (r === 8 && c === 1) return 265; // avoid unintended strong on col1
        if (r === 1 && c === 1) return 511; // sees A and F -> remove 9
        return 255; // default: no 9
      }),
    },
    expected: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        if (r === 0 && c === 1) return 257;
        if (r === 0 && c === 5) return 272;
        if (r === 4 && c === 5) return 288;
        if (r === 4 && c === 7) return 320;
        if (r === 2 && c === 7) return 384;
        if (r === 2 && c === 2) return 258;
        if (r === 8 && c === 5) return 260;
        if (r === 7 && c === 7) return 264;
        if (r === 8 && c === 1) return 265;
        if (r === 1 && c === 1) return 255;
        return 255;
      }),
    },
  },
  {
    name: "xyChain 1 (synthetic / {1,2}-{2,3}-{1,3}, elim r4c0:1)",
    techniqueId: TechniqueId.XY_CHAIN,
    input: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        if (r === 0 && c === 0) return 3; // A {1,2}
        if (r === 0 && c === 4) return 6; // B {2,3}
        if (r === 4 && c === 4) return 5; // C {1,3}
        if (r === 4 && c === 0) return 511; // sees A and C -> remove 1
        return 504; // default no 1,2,3
      }),
    },
    expected: {
      values81: "0".repeat(81),
      candidateMasks81: Array.from({ length: 81 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        if (r === 0 && c === 0) return 3;
        if (r === 0 && c === 4) return 6;
        if (r === 4 && c === 4) return 5;
        if (r === 4 && c === 0) return 510;
        return 504;
      }),
    },
  },
  {
    name: "fish33 1 (SudokuWiki Swordfish / after pencil)",
    techniqueId: TechniqueId.FISH_33,
    input: {
      values81:
        "900000000037010420840000603000034810000060000068120000102000084085070360000000001",
      candidateMasks81: [
        0, 19, 33, 254, 152, 246, 81, 80, 208, 48, 0, 0, 432, 0, 432, 0, 0, 400, 0,
        0, 1, 338, 272, 338, 0, 336, 0, 82, 338, 256, 336, 0, 0, 0, 0, 370, 94, 339,
        269, 464, 0, 464, 338, 348, 338, 92, 0, 0, 0, 0, 336, 336, 348, 336, 0, 320,
        0, 308, 272, 308, 336, 0, 0, 8, 0, 0, 266, 0, 259, 0, 0, 258, 108, 320, 300,
        446, 408, 438, 338, 336, 0,
      ],
    },
    expected: {
      values81:
        "900000000037010420840000603000034810000060000068120000102000084085070360000000001",
      candidateMasks81: [
        0, 18, 32, 254, 152, 246, 81, 80, 208, 48, 0, 0, 432, 0, 432, 0, 0, 400, 0,
        0, 1, 338, 272, 338, 0, 336, 0, 82, 338, 256, 336, 0, 0, 0, 0, 370, 94, 339,
        269, 464, 0, 464, 338, 348, 338, 92, 0, 0, 0, 0, 336, 336, 348, 336, 0, 320,
        0, 308, 272, 308, 336, 0, 0, 8, 0, 0, 266, 0, 259, 0, 0, 258, 108, 320, 300,
        446, 408, 438, 338, 336, 0,
      ],
    },
  },
  {
    name: "fish44 1 (SudokuWiki Jellyfish exemplar / after pencil)",
    techniqueId: TechniqueId.FISH_44,
    input: {
      values81:
        "000000000017020803003000204084053706000000000072010005048071502035040601000000000",
      candidateMasks81: [
        442, 306, 288, 509, 420, 504, 257, 369, 320, 312, 0, 0, 312, 0, 312, 0, 304, 0,
        432, 304, 0, 497, 416, 496, 0, 369, 0, 257, 0, 0, 258, 0, 0, 0, 259, 0, 309,
        304, 289, 490, 416, 490, 269, 399, 384, 292, 0, 0, 424, 0, 424, 268, 396, 0,
        288, 0, 0, 292, 0, 0, 0, 260, 0, 322, 0, 0, 386, 0, 386, 0, 448, 0, 355, 290,
        289, 438, 420, 434, 268, 460, 448,
      ],
    },
    expected: {
      values81:
        "000000000017020803003000204084053706000000000072010005048071502035040601000000000",
      candidateMasks81: [
        186, 306, 288, 253, 420, 248, 257, 113, 320, 312, 0, 0, 312, 0, 312, 0, 304,
        0, 176, 304, 0, 241, 416, 240, 0, 113, 0, 257, 0, 0, 258, 0, 0, 0, 259, 0, 53,
        304, 289, 234, 416, 234, 269, 143, 384, 36, 0, 0, 168, 0, 168, 268, 140, 0,
        288, 0, 0, 292, 0, 0, 0, 260, 0, 322, 0, 0, 386, 0, 386, 0, 448, 0, 99, 290,
        289, 182, 420, 178, 268, 204, 448,
      ],
    },
  },
];
