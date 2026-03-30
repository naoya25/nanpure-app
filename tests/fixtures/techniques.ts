import { TechniqueId } from "@/lib/types/sudoku_technique_types";

export type TechniqueCaseBase = {
  name: string;
  techniqueId: TechniqueId;
  input: {
    /** 81 文字。空は `0` */
    values81: string;
    /** 81 要素。空セルの候補ビットマスク（9ビット想定）。 0x1ff は全候補を許可 */
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
];
