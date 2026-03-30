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
  expected: string;
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
    expected:
      "123456789000000000000000000000000000000000000000000000000000000000000000000000000",
  },
  {
    name: "fullHouse 2",
    techniqueId: TechniqueId.FULL_HOUSE,
    input: {
      values81:
        "123000000456000000780000000000000000000000000000000000000000000000000000000000000",
      candidateMasks81: new Array(81).fill(0),
    },
    expected:
      "123000000456000000789000000000000000000000000000000000000000000000000000000000000",
  },
  {
    name: "fullHouse 3",
    techniqueId: TechniqueId.FULL_HOUSE,
    input: {
      values81:
        "100000000200000000300000000400000000500000000600000000700000000800000000000000000",
      candidateMasks81: new Array(81).fill(0),
    },
    expected:
      "100000000200000000300000000400000000500000000600000000700000000800000000900000000",
  },
  {
    name: "single 1",
    techniqueId: TechniqueId.SINGLE,
    input: {
      values81:
        "008007900042005000000600050003006801000000006900070000080130470000090000010000000",
      candidateMasks81: new Array(81).fill(0),
    },
    expected:
      "008007900042005000000600050003006801000000006900070000080132470000090000010000000",
  },
  {
    name: "hiddenSingle 1",
    techniqueId: TechniqueId.HIDDEN_SINGLE,
    input: {
      values81:
        "760000012500007409084100600030806200000000000002904050003002940106300007290000083",
      candidateMasks81: new Array(81).fill(0),
    },
    expected:
      "760000012521687409384120670030806290008200060602904050803002946146308027290060183",
  },
];
