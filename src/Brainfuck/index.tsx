import React, { ReactElement } from "react";
import "./fonts/fonts.css";
import "./styles.scss";

const valid_tokens = [">", "<", "+", "-", ".", ",", "[", "]"];

class Brainfuck extends React.Component<BrainfuckProps, BrainfuckState> {
  componentRef: React.RefObject<HTMLDivElement>;
  titleRef: React.RefObject<HTMLDivElement>;
  static defaultProps: BrainfuckProps = {
    program: ">>>>++<<",
  };
  constructor(props: BrainfuckProps) {
    super(props);
    // Binds

    // defaults
    this.componentRef = React.createRef();
    this.titleRef = React.createRef();
    console.log("program", props.program);
    const tokens = props.program
      .split("")
      .filter((t) => valid_tokens.includes(t));
    this.state = {
      memory: new Int8Array(4096),
      tokens,
      memPointer: 0,
      progPointer: 0,
      memMin: 0,
      memMax: 30,
    };
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
      <div className={"memdata " + index === memPointer ? "current" : ""}>
        {s}
      </div>
    );
  }
  render() {
    const { state } = this;
    const divs = [];
    for (let i = state.memMin; i < state.memMax; i++) {
      divs.push(this.toBinary(state.memory[i], i));
      if (i % 8 === 7) divs.push(<hr />);
    }
    return (
      <div ref={this.componentRef} className="Brainfuck">
        <div className="container flex column center">
          <div className="main flex row">
            <div className="buttons flex column center"></div>
            <div className="prog flex column">
              <div ref={this.titleRef} className="title border">
                <span>Brainf*ck</span>
              </div>
              <div className="program border">
                {state.tokens.map((t) => (
                  <span>{t}</span>
                ))}
              </div>
              <div className="output border"></div>
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
