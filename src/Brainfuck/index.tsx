import React from "react";
import "./fonts/fonts.css";
import "./styles.scss";
import {
  Done,
  Edit,
  FastForward,
  FontDownload,
  Pause,
  PlayArrow,
  SkipNext,
  Stop,
} from "@mui/icons-material";

const valid_tokens = [">", "<", "+", "-", ".", ",", "[", "]"];

const MAX_VALUE = Math.pow(2, 7);

const default_prog = ",.";

class Brainfuck extends React.Component<BrainfuckProps, BrainfuckState> {
  componentRef: React.RefObject<HTMLDivElement>;
  titleRef: React.RefObject<HTMLDivElement>;
  static defaultProps: BrainfuckProps = {
    program: default_prog,
    maxMem: 4096,
  };
  player: number | null;
  constructor(props: BrainfuckProps) {
    super(props);

    // defaults
    this.componentRef = React.createRef();
    this.titleRef = React.createRef();
    console.log("program", props.program);
    const tokens = props.program
      .split("")
      .filter((t) => valid_tokens.includes(t));
    this.state = {
      memory: new Int8Array(props.maxMem),
      tokens,
      memPointer: 0,
      progPointer: 0,
      memMin: 0,
      memMax: 30,
      outputs: [],
      isDone: false,
      isAscii: false,
      isEditing: false,
      isInputing: false,
      afterInput: "pause",
    };
    this.player = null;
  }

  step() {
    let {
      tokens,
      memory,
      progPointer,
      memPointer,
      memMax,
      outputs,
      isDone,
      isEditing,
      isInputing,
    } = this.state;
    if (isDone) return isDone;
    const token = tokens[progPointer];
    let count = 1;
    switch (token) {
      case ">":
        memPointer += 1;
        if (memPointer >= memMax) memMax = memPointer;
        progPointer += 1;
        this.setState({ memPointer, progPointer, memMax });
        break;
      case "<":
        memPointer -= 1;
        progPointer += 1;
        this.setState({ memPointer, progPointer });
        break;
      case "+":
        memory[memPointer] = (memory[memPointer] + 1) % MAX_VALUE;
        progPointer += 1;
        this.setState({ memory, progPointer });
        break;
      case "-":
        memory[memPointer] = (memory[memPointer] - 1 + MAX_VALUE) % MAX_VALUE;
        progPointer += 1;
        this.setState({ memory, progPointer });
        break;
      case ".":
        outputs.push({ type: "output", value: memory[memPointer] });
        progPointer += 1;
        this.setState({ outputs, progPointer });
        break;
      case ",":
        this.pause();
        this.setState({ isInputing: true });
        break;
      case "[":
        if (memory[memPointer] === 0) {
          const init_pointer = progPointer;
          while (count > 0) {
            progPointer += 1;
            if (progPointer === tokens.length) {
              outputs.push({ type: "error", value: "Unmatched bracket" });
              progPointer = init_pointer;
              isDone = true;
              this.setState({ outputs, progPointer, isDone });
              return isDone;
            } else if (tokens[progPointer] === "[") {
              count += 1;
            } else if (tokens[progPointer] === "]") {
              count -= 1;
            }
          }
          progPointer += 1;
        } else {
          progPointer += 1;
          this.setState({ progPointer });
        }
        break;
      case "]":
        if (memory[memPointer] > 0) {
          const init_pointer = progPointer;
          while (count > 0) {
            progPointer -= 1;
            if (progPointer === -1) {
              outputs.push({ type: "error", value: "Unmatched bracket" });
              progPointer = init_pointer;
              isDone = true;
              this.setState({ outputs, progPointer, isDone });
              return isDone;
            } else if (tokens[progPointer] === "[") {
              count -= 1;
            } else if (tokens[progPointer] === "]") {
              count += 1;
            }
          }
          progPointer += 1;
        } else {
          progPointer += 1;
          this.setState({ progPointer });
        }
        break;
    }
    if (progPointer === tokens.length) {
      progPointer = tokens.length - 1;
      isDone = true;
    } else if (progPointer < 0 || progPointer > tokens.length) {
      isDone = true;
      throw new Error(
        "Brainfuck: Invalid state of programPointer:" + progPointer,
      );
    }
    if (memPointer === memory.length) {
      memPointer = memory.length - 1;
    } else if (memPointer < 0) {
      memPointer = 0;
    }
    this.setState({ memPointer, progPointer, isDone });
    return isDone;
  }

  toOutput(data: Output, ind: number, arr: Output[]) {
    let cl = "outdata ";
    if (ind === arr.length - 1) cl += "current ";
    switch (data.type) {
      case "input":
        return (
          <div className={cl} key={ind}>
            $ {data.value}
          </div>
        );
      case "output":
        return (
          <div className={cl} key={ind}>
            : {data.value}
          </div>
        );
      case "error":
        return (
          <div className={cl + "error"} key={ind}>
            ! {data.value}
          </div>
        );
    }
  }

  toBinary(value: number, index: number) {
    const { memPointer } = this.state;
    let s: string = "";
    let v = value;
    for (let i = 0; i < 8; i++) {
      s = `${v % 2}` + s;
      v = Math.floor(v / 2);
      if (i === 3) s = " " + s;
    }
    return (
      <div
        title={`${value} (${String.fromCharCode(value)})`}
        key={index}
        className={"memdata " + (index === memPointer ? "current" : "")}
      >
        {s}
      </div>
    );
  }

  handlePause() {
    this.setState({ afterInput: "pause" });
    this.pause();
  }

  pause() {
    console.log("pause");
    if (this.player) clearInterval(this.player);
  }

  run() {
    this.pause();
    if (this.state.isEditing) return;
    console.log("play");
    this.setState({ afterInput: "play" });
    this.player = setInterval(() => {
      if (this.finished()) {
        this.pause();
        return;
      }
      this.step();
    }, 25);
  }

  ff() {
    this.pause();
    if (this.state.isEditing) return;
    console.log("ff");
    this.setState({ afterInput: "ff" });
    this.player = setInterval(() => {
      if (this.finished()) {
        this.pause();
        return;
      }
      this.step();
    }, 1);
  }

  reset() {
    this.pause();
    console.log("reset");
    this.setState({
      progPointer: 0,
      memPointer: 0,
      memory: new Int8Array(this.props.maxMem),
      memMin: 0,
      memMax: 30,
      outputs: [],
      isDone: false,
      isEditing: false,
      isInputing: false,
      afterInput: "pause",
    });
  }

  finished() {
    return this.state.isDone;
  }

  makeAscii() {
    const { outputs } = this.state;
    const str = outputs
      .filter((v) => v.type === "output")
      .map((v) => String.fromCharCode(v.value))
      .join("");
    const others = outputs
      .filter((v) => v.type !== "output")
      .map(this.toOutput);

    return (
      <>
        <div className="ascii">{str}</div>
        <div className={"others " + (others.length > 0 ? "border" : "")}>
          {others}
        </div>
      </>
    );
  }

  render() {
    const { state } = this;
    const divs = [];
    for (let i = state.memMin; i < state.memMax; i++) {
      divs.push(this.toBinary(state.memory[i], i));
      if (i % 8 === 7) divs.push(<hr key={`hr${i}`} />);
    }
    const outputDivs = state.outputs.map(this.toOutput);
    return (
      <div ref={this.componentRef} className="Brainfuck">
        <div className="container flex column center">
          <div className="main flex row">
            <div className="buttons flex column border">
              <div className="playback flex column ">
                <button title="Step" onClick={() => this.step()}>
                  <SkipNext />
                </button>
                <button title="Run" onClick={() => this.run()}>
                  <PlayArrow />
                </button>
                <button title="Run (fast)" onClick={() => this.ff()}>
                  <FastForward />
                </button>
                <button title="Pause" onClick={() => this.handlePause()}>
                  <Pause />
                </button>
                <button title="Reset" onClick={() => this.reset()}>
                  <Stop />
                </button>
              </div>
              <div className="modes flex column ">
                <button
                  title="Toggle ASCII"
                  onClick={() => this.setState({ isAscii: !state.isAscii })}
                >
                  <FontDownload />
                </button>
                <button title="Edit program" onClick={() => this.edit()}>
                  <Edit />
                </button>
              </div>
            </div>
            <div className="prog flex column">
              <div ref={this.titleRef} className="title border">
                <span>Brainf*ck</span>
              </div>
              <div className="program border ">
                <div className="progscroll">
                  {state.tokens.map((t, i) => (
                    <span
                      key={i}
                      className={
                        i === state.progPointer
                          ? "progdata current"
                          : "progdata"
                      }
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              {state.isAscii ? (
                <div className="ascii-cont border">{this.makeAscii()}</div>
              ) : (
                <div className="output border">
                  <div className="outscroll flex column">{outputDivs}</div>
                </div>
              )}
            </div>
            <div className="memory border">
              <div className="memscroll flex column">{divs}</div>
            </div>
          </div>
          {state.isEditing && (
            <div className="io border">{this.makeEditor()}</div>
          )}
          {state.isInputing && (
            <div className="io border">{this.makeInput()}</div>
          )}
        </div>
      </div>
    );
  }

  makeInput() {
    const t = React.createRef<HTMLInputElement>();
    return (
      <>
        <input ref={t}></input>
        <div>
          <button onClick={() => this.handleInput(t.current!.value)}>
            <Done />
          </button>
        </div>
      </>
    );
  }

  handleInput(value: string) {
    let { outputs, progPointer, memory, memPointer, afterInput } = this.state;
    let v;
    try {
      v = Number(value);
      if (!Number.isInteger(v)) throw new Error("Not an integer");
      if (v < 0 || v >= 128) throw new Error("Number not within bounds");
      outputs.push({ type: "input", value: v });
      memory[memPointer] = v;
      progPointer += 1;
      this.setState({ outputs, progPointer, memory, memPointer, isInputing: false });
      switch (afterInput) {
        case "play":
          this.run();
          break;
        case "ff":
          this.ff();
          break;
        case "pause":
          this.pause();
          break;
      }
    } catch (e) {
      console.error(e);
      outputs.push({
        type: "error",
        value: "Please enter an integer between 0 and 127",
      });
      this.setState({ outputs });
    }
  }

  makeEditor() {
    const { tokens } = this.state;
    const ta = React.createRef<HTMLTextAreaElement>();
    return (
      <>
        <textarea ref={ta} defaultValue={tokens.join("")}></textarea>
        <div>
          <button
            onClick={() => {
              this.setState({
                tokens: ta
                  .current!.value.split("")
                  .filter((v) => valid_tokens.includes(v)),
                isEditing: false,
              });
              this.reset();
            }}
          >
            <Done />
          </button>
        </div>
      </>
    );
  }

  edit() {
    this.pause();
    const { isEditing } = this.state;
    if (!isEditing) {
      this.setState({ isEditing: true });
    } else {
      this.setState({ isEditing: false });
    }
  }

  componentDidUpdate() // prevProps: Readonly<BrainfuckProps>,
    // prevState: Readonly<BrainfuckState>,
    // snapshot?: any,
    : void {
    const component = this.componentRef.current!;
    scrollToElement(
      component.querySelector(".memory")!,
      component.querySelector(".memdata.current")!,
    );
    if (this.state.isAscii) {
      scrollToElement(
        component.querySelector(".others")!,
        component.querySelector(".outdata.current")!,
      );
    } else {
      scrollToElement(
        component.querySelector(".output")!,
        component.querySelector(".outdata.current")!,
      );
    }
    scrollToElement(
      component.querySelector(".program")!,
      component.querySelector(".progdata.current")!,
    );
  }

  componentDidMount(): void {
    const component = this.componentRef.current!;
    const title = this.titleRef.current!;
    const title_height = title.clientHeight!;
    component.style.fontSize = `${title_height / 2.4}px`;
  }
}

function scrollToElement(container: HTMLElement, element: HTMLElement) {
  if (!element) return;
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  if (elementRect.top < containerRect.top) {
    container.scrollTop = element.offsetTop - container.offsetTop;
  } else if (elementRect.bottom > containerRect.bottom) {
    container.scrollTop = element.offsetTop - container.offsetTop;
  }
}

export default Brainfuck;
