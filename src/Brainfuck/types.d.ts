declare interface BrainfuckProps {
  program: string;
  maxMem: number;
}

declare type Output =
  | {
      type: "input";
      value: number;
    }
  | {
      type: "output";
      value: number;
    }
  | {
      type: "error";
      value: string;
    };

declare type BrainfuckState = {
  tokens: string[];
  memory: Int8Array;
  progPointer: number;
  memPointer: number;
  memMin: number;
  memMax: number;
  outputs: Output[];
  isDone: booelan;
  isAscii: boolean;
  isEditing: boolean;
  isInputing: boolean;
  afterInput: "play" | "ff" | "pause";
};
