import React, { ReactElement } from "react";
import "./fonts/fonts.css";
import "./styles.scss";

const valid_tokens = [">", "<", "+", "-", ".", ",", "[", "]"];

const MAX_VALUE = Math.pow(2, 7);

class Brainfuck extends React.Component<BrainfuckProps, BrainfuckState> {
  componentRef: React.RefObject<HTMLDivElement>;
  titleRef: React.RefObject<HTMLDivElement>;
  static defaultProps: BrainfuckProps = {
    program: ">>>>++.<<.+]-.",
    maxMem: 4096,
  };
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
      isDone: false,
      memMin: 0,
      memMax: 30,
      outputs: [],
    };
  }

  step() {
    let { tokens, memory, progPointer, memPointer, memMax, outputs, isDone } =
      this.state;
    if (isDone) return;
    const token = tokens[progPointer];
    let count = 1;
    switch (token) {
      case ">":
        memPointer += 1;
        progPointer += 1;
        this.setState({ memPointer, progPointer });
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
        // WARN: Unimplemenmted
        progPointer += 1;
        this.setState({ progPointer });
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
              return;
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
              return;
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
      throw new Error(
        "Brainfuck: invalid state of programPointer:" + progPointer,
      );
    }
    if (memPointer === memory.length) {
      memPointer = memory.length - 1;
    } else if (memPointer < 0) {
      memPointer = 0;
    }
    this.setState({ memPointer, progPointer, isDone });
  }

  toOutput(data: Output, ind: number) {
    switch (data.type) {
      case "input":
        return <div key={ind}>$ {data.value}</div>;
      case "output":
        return <div key={ind}>: {data.value}</div>;
      case "error":
        return (
          <div key={ind} className="error">
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
        title={`${value}`}
        key={index}
        className={"memdata " + (index === memPointer ? "current" : "")}
      >
        {s}
      </div>
    );
  }

  runAll() {
    let { isDone } = this.state;
    while (!isDone) {
      console.log("step");
      this.step();
      isDone = this.state.isDone;
    }
  }
  render() {
    const { state } = this;
    const divs = [];
    for (let i = state.memMin; i < state.memMax; i++) {
      divs.push(this.toBinary(state.memory[i], i));
      if (i % 8 === 7) divs.push(<hr key={`hr${i}`} />);
    }
    const outputDivs = state.outputs.map((v, i) => this.toOutput(v, i));
    return (
      <div ref={this.componentRef} className="Brainfuck">
        <div className="container flex column center">
          <div className="main flex row">
            <div className="buttons flex column center"></div>
            <div className="prog flex column">
              <div
                ref={this.titleRef}
                className="title border"
                onClick={() => this.runAll()}
              >
                <span onClick={() => this.step()}>Brainf*ck</span>
              </div>
              <div className="program border">
                {state.tokens.map((t, i) => (
                  <span
                    key={i}
                    className={i === state.progPointer ? "current" : ""}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="output border">
                <div className="outscroll flex column">{outputDivs}</div>
              </div>
            </div>
            <div className="memory border">
              <div className="memscroll flex column">{divs}</div>
            </div>
          </div>
          <div className="io border">IO</div>
        </div>
      </div>
    );
  }

  componentDidMount(): void {
    const component = this.componentRef.current!;
    const title = this.titleRef.current!;
    const title_height = title.clientHeight!;
    component.style.fontSize = `${(title_height - 16) / 1.5}px`;
  }
}

export default Brainfuck;
