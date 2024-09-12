declare interface BrainfuckProps {
  program: string;
}

declare type BrainfuckState = {
  tokens: string[];
  memory: Int8Array;
  progPointer: number;
  memPointer: number;
  memMin: number;
  memMax: number;
};
