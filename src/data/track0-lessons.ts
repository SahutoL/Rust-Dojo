import {
  createAuthoredLesson,
  type LessonData,
} from "./lesson-authoring";

export const track0Lessons: LessonData[] = [
  createAuthoredLesson({
    slug: "what-is-computer",
    title: "コンピュータとは何か",
    summary:
      "入力、処理、出力の流れと、CPU、メモリ、ストレージの役割を区別できるようになる。",
    estimatedMinutes: 18,
    explanationSections: [
      {
        title: "コンピュータは入力を処理して出力する",
        content: `コンピュータは、受け取った情報を決められた手順で処理し、結果を返す機械です。電卓もゲーム機も Web サービスも、この流れで動いています。

最初に押さえるべき形は次の 3 つです。

- 入力: キーボード、マウス、センサー、ファイル
- 処理: 比較、計算、分岐、繰り返し
- 出力: 画面表示、音、ファイル書き込み

「何を受け取り、どう処理し、何を返すか」を言葉にできると、プログラムを読むときも書くときも迷いにくくなります。`,
      },
      {
        title: "CPU、メモリ、ストレージの役割",
        content: `部品の役割を混同しないことが大切です。

- CPU: 命令を順に実行する
- メモリ: 実行中の値を一時的に置く
- ストレージ: 電源を切っても残したいデータを保存する

料理でたとえるなら、CPU は調理する手、メモリは作業台、ストレージは冷蔵庫や棚に近い役目です。作業台の上に置くものは実行中に増減しますが、棚に置いた材料は長く残ります。`,
      },
      {
        title: "プログラムが動くまでの順番",
        content: `Rust の学習でよく見る流れは次の順番です。

1. 人がソースコードを書く
2. ` + "`rustc`" + ` や Cargo がコンパイルする
3. 実行可能な形になったものを動かす
4. CPU が命令を順に実行し、結果を出力する

この段階では「コンパイル前のコード」と「実行中に CPU が処理する命令」は別物だと分かれば十分です。後でエラーを読むときも、この区別が土台になります。`,
      },
    ],
    quiz: {
      question: "CPU、メモリ、ストレージの説明として正しいものはどれですか。",
      options: [
        "CPU が命令を実行し、メモリは実行中の値を置き、ストレージは長く保存する",
        "CPU がデータを長期保存し、メモリが計算し、ストレージが画面に出す",
        "メモリが命令を実行し、CPU は値を保管し、ストレージは不要になる",
        "3 つとも同じ役割で、名前だけが違う",
      ],
      correctIndex: 0,
      explanation:
        "CPU は処理担当、メモリは一時置き場、ストレージは長期保存です。まずは役割を分けて覚えてください。",
    },
    sandbox: {
      prompt:
        "短い Rust プログラムを実行し、ソースコードを書いてから結果が出るまでの流れを確認します。",
      starterCode: `fn main() {
    let total = 2 + 3;
    println!("2 + 3 = {}", total);
}
`,
      stdin: "",
      successMode: "compile",
    },
    summarySection: {
      content: `- コンピュータは入力、処理、出力の流れで動く
- CPU、メモリ、ストレージは役割が違う
- Rust では「コードを書く → コンパイルする → 実行する」の順で考える`,
    },
  }),
  createAuthoredLesson({
    slug: "what-is-program",
    title: "プログラムとは何か",
    summary:
      "命令の列としてのプログラム、入力と出力、コンパイル時エラーの位置づけを理解する。",
    estimatedMinutes: 20,
    explanationSections: [
      {
        title: "プログラムは命令の列である",
        content: `プログラムは、コンピュータにしてほしい仕事を順番に書いた命令の列です。上から順に読まれることが多いため、「何を先に行い、何をあとで行うか」が大事になります。

次のコードは、3 つの表示命令を順に実行します。

\`\`\`rust
fn main() {
    println!("1 行目");
    println!("2 行目");
    println!("3 行目");
}
\`\`\`

命令の並び方が変わると、結果の順番も変わります。`,
      },
      {
        title: "入力、処理、出力で考える",
        content: `多くのプログラムは「入力を受けて、処理し、出力する」という形で説明できます。

- 入力: 何を受け取るか
- 処理: 何を比べるか、計算するか
- 出力: 何を返すか

問題文を読むときも、まずこの 3 つへ分けて整理すると理解しやすくなります。実装に入る前に、日本語で整理する習慣をつけておくと後で強くなります。`,
      },
      {
        title: "コンパイルと実行は別の段階",
        content: `Rust では、書いたコードをすぐ動かすのではなく、まずコンパイルします。コンパイルが通らないと、実行まで進めません。

この順番には意味があります。誤った書き方を早い段階で止められるので、原因を小さく切り分けやすいからです。

初心者のうちは「エラーが出たら失敗」ではなく、「実行前に気づけた」と考えるほうが前に進みやすくなります。`,
      },
    ],
    quiz: {
      question: "Rust でコンパイルエラーが出たときの説明として正しいものはどれですか。",
      options: [
        "実行の前に修正すべき書き方の問題が見つかった状態",
        "プログラムは正しく動いたが、表示だけが間違っている状態",
        "CPU が壊れているので処理を続けられない状態",
        "実行後にだけ確認できる結果なので、そのまま進めてよい状態",
      ],
      correctIndex: 0,
      explanation:
        "コンパイルエラーは実行前の段階で見つかる書き方の問題です。まず修正してから実行します。",
    },
    sandbox: {
      prompt:
        "命令が上から順に実行されることを、表示の順番で確かめます。",
      starterCode: `fn main() {
    println!("入力を受け取る");
    println!("処理する");
    println!("結果を出力する");
}
`,
      stdin: "",
      successMode: "compile",
    },
    summarySection: {
      content: `- プログラムは命令の列
- 問題文は入力、処理、出力で読む
- Rust はコンパイルが通ってから実行する`,
    },
  }),
  createAuthoredLesson({
    slug: "values-and-variables",
    title: "値と変数",
    summary:
      "値に名前を付けて扱う理由と、`let`、`mut` の使い分けを理解する。",
    estimatedMinutes: 22,
    explanationSections: [
      {
        title: "値はプログラムが扱う中身",
        content: `プログラムが扱う中身を値と呼びます。数値、文字列、真偽値は、最初に出会う代表的な値です。

- 数値: \`10\`, \`-3\`
- 文字列: \`"Rust"\`
- 真偽値: \`true\`, \`false\`

「いま何を持っているか」が値です。まだ名前が付いていなくても、値そのものは存在します。`,
      },
      {
        title: "変数は値に付ける名前",
        content: `同じ値をあとで使いたいときは、名前を付けて保持します。その名前が変数です。Rust では \`let\` を使います。

\`\`\`rust
fn main() {
    let score = 80;
    let passed = true;
    println!("score = {}", score);
    println!("passed = {}", passed);
}
\`\`\`

変数名は「何が入っているか」を読む人へ伝える道具です。短すぎる名前より、役割が分かる名前のほうが後で助かります。`,
      },
      {
        title: "値を変えるときだけ mut を使う",
        content: `Rust の変数は、何も付けないと変更できません。値を変える予定があるときだけ \`mut\` を付けます。

\`\`\`rust
fn main() {
    let mut count = 0;
    count += 1;
    println!("{}", count);
}
\`\`\`

最初から何でも変更可能にしないのは、どこで値が変わるかを追いやすくするためです。`,
      },
    ],
    quiz: {
      question: "変数の説明として最も適切なものはどれですか。",
      options: [
        "値をあとで使えるように名前を付けたもの",
        "コンパイルだけを行うための特別な記号",
        "CPU の代わりに計算してくれる部品",
        "必ず数値しか入れられない箱",
      ],
      correctIndex: 0,
      explanation:
        "変数は値に名前を付けて再利用しやすくする仕組みです。値そのものと区別して覚えます。",
    },
    sandbox: {
      prompt:
        "変数へ名前を付け、必要な場所だけ `mut` を付けて値を更新します。",
      starterCode: `fn main() {
    let name = "Rust Dojo";
    let mut count = 0;

    count += 1;
    println!("{}: {}", name, count);
}
`,
      stdin: "",
      successMode: "compile",
    },
    summarySection: {
      content: `- 値は中身、変数はその値に付けた名前
- Rust では \`let\` で変数を作る
- 値を変える予定があるときだけ \`mut\` を付ける`,
    },
  }),
  createAuthoredLesson({
    slug: "types-and-representation",
    title: "型",
    summary:
      "型が値の扱い方を決めることを理解し、数値、真偽値、文字列を区別して読めるようになる。",
    estimatedMinutes: 20,
    explanationSections: [
      {
        title: "型は何ができる値かを決める",
        content: `型は「その値が何であり、どんな操作をしてよいか」を表す情報です。値に説明書きを付けるものだと考えると分かりやすくなります。

たとえば数値なら足し算ができます。真偽値なら ` + "`if`" + ` の条件に使えます。文字列は文字の並びとして表示できます。型が違えば、使える操作も変わります。`,
      },
      {
        title: "よく使う型を区別する",
        content: `まずは次の 3 種類をしっかり区別してください。

- 整数: ` + "`i32`" + ` など。個数や点数を表す
- 真偽値: ` + "`bool`" + `。真か偽かを表す
- 文字列: ` + "`&str`" + ` や ` + "`String`" + `。文章や名前を表す

\`\`\`rust
fn main() {
    let apples: i32 = 3;
    let is_open: bool = true;
    let title: &str = "Rust";
    println!("{} {} {}", apples, is_open, title);
}
\`\`\`

値の見た目だけでなく、どう使うかまで含めて型を捉えるのが大事です。`,
      },
      {
        title: "型の食い違いは早めに直す",
        content: `数値として扱うつもりの値に文字列を入れたり、真偽値に足し算をしようとしたりすると、Rust はコンパイル時に止めてくれます。

これは厳しさではなく助けです。型が合っていない場所を早く見つけられるので、実行後に原因不明のずれを追い回しにくくなります。`,
      },
    ],
    quiz: {
      question: "型の役割として最も近い説明はどれですか。",
      options: [
        "その値に何の操作ができるかを決める",
        "プログラムを自動で速くする機能",
        "変数の名前を短くするための省略記号",
        "実行結果を画面に出す専用の命令",
      ],
      correctIndex: 0,
      explanation:
        "型は値の扱い方を決めます。数値、真偽値、文字列ではできる操作が違います。",
    },
    sandbox: {
      prompt:
        "整数、真偽値、文字列をひとつずつ宣言し、どんな値かを表示して確かめます。",
      starterCode: `fn main() {
    let items: i32 = 4;
    let ready: bool = true;
    let label: &str = "box";

    println!("items = {}", items);
    println!("ready = {}", ready);
    println!("label = {}", label);
}
`,
      stdin: "",
      successMode: "compile",
    },
    summarySection: {
      content: `- 型は「どんな値か」と「どう扱えるか」を決める
- 整数、真偽値、文字列は役割が違う
- 型エラーは実行前に直すための手掛かりになる`,
    },
  }),
  createAuthoredLesson({
    slug: "memory-basics",
    title: "メモリ",
    summary:
      "実行中の値がメモリへ置かれることと、変数名と値の置き場所を分けて考える視点を身に付ける。",
    estimatedMinutes: 18,
    explanationSections: [
      {
        title: "メモリは実行中の値を置く場所",
        content: `プログラムが動いている間、値はどこかに置かれています。その一時的な置き場所がメモリです。

電源を切っても残るストレージとは役割が違います。メモリは「いま実行中の計算に必要なもの」を置く場所だと考えてください。`,
      },
      {
        title: "変数名と値の置き場所は別に考える",
        content: `変数名は人が読むための名前です。一方で実行中の値はメモリ上に置かれます。

\`\`\`rust
fn main() {
    let first = 10;
    let second = first;
    println!("first = {}", first);
    println!("second = {}", second);
}
\`\`\`

この段階では、「変数名は値を扱うための目印で、値そのものとは別物」と考えられれば十分です。`,
      },
      {
        title: "途中の値を見ればメモリの変化を追いやすい",
        content: `メモリそのものを直接見る必要はありません。まずは途中の値を表示し、「どの時点でどの値になっているか」を追えるようになることが先です。

後で所有権や借用を学ぶときも、途中の値を丁寧に追う癖が理解を支えます。`,
      },
    ],
    quiz: {
      question: "このレッスン時点でのメモリの説明として適切なものはどれですか。",
      options: [
        "実行中の値を一時的に置く場所",
        "電源を切っても残る長期保存の場所",
        "変数名だけを集めて置く特別な場所",
        "コンパイルエラーを自動で直す仕組み",
      ],
      correctIndex: 0,
      explanation:
        "メモリは実行中の値の置き場所です。ストレージとの違いを分けて覚えることが大切です。",
    },
    sandbox: {
      prompt:
        "値を別の変数へ入れ、途中の状態を表示して追いかけます。",
      starterCode: `fn main() {
    let first = 10;
    let second = first;
    let total = first + second;

    println!("first = {}", first);
    println!("second = {}", second);
    println!("total = {}", total);
}
`,
      stdin: "",
      successMode: "compile",
    },
    summarySection: {
      content: `- メモリは実行中の値の置き場所
- 変数名と値そのものは分けて考える
- 途中の値を表示すると変化を追いやすい`,
    },
  }),
  createAuthoredLesson({
    slug: "condition-branches",
    title: "条件分岐",
    summary:
      "条件によって処理を切り替える考え方を理解し、`if` と `else` を読み書きできるようになる。",
    estimatedMinutes: 22,
    explanationSections: [
      {
        title: "条件が真か偽かで道を分ける",
        content: `条件分岐は、状況によって処理を変える仕組みです。判定に使う式は、最終的に ` + "`true`" + ` か ` + "`false`" + ` になります。

\`\`\`rust
fn main() {
    let score = 82;

    if score >= 80 {
        println!("合格");
    } else {
        println!("再挑戦");
    }
}
\`\`\`

先に「何をもとに分けるのか」を言葉で決めると、条件式が書きやすくなります。`,
      },
      {
        title: "比較の結果は真偽値になる",
        content: `\`score >= 80\` のような比較は、計算結果として真偽値を返します。条件分岐は、その真偽値を見て進む道を決めます。

よく使う比較には次があります。

- ` + "`==`" + ` : 等しい
- ` + "`!=`" + ` : 等しくない
- ` + "`>=`" + ` : 以上
- ` + "`<=`" + ` : 以下`,
      },
      {
        title: "条件の順番も意味を持つ",
        content: `条件が複数あるときは、上から順に評価されます。先に広い条件を書くと、あとに書いた細かい条件へ届かないことがあります。

迷ったときは「どの条件を先に満たすか」を日本語で並べてから書き始めると、分岐の漏れを減らせます。`,
      },
    ],
    quiz: {
      question: "`if` の条件として直接使う値は何ですか。",
      options: [
        "真偽値",
        "必ず文字列",
        "必ず配列",
        "必ず関数",
      ],
      correctIndex: 0,
      explanation:
        "`if` は真か偽かで分岐を決めるので、条件式の結果は真偽値になります。",
    },
    sandbox: {
      prompt:
        "点数が基準以上かどうかで表示を切り替え、条件分岐の形に慣れます。",
      starterCode: `fn main() {
    let score = 76;

    if score >= 80 {
        println!("合格");
    } else {
        println!("もう少し");
    }
}
`,
      stdin: "",
      successMode: "compile",
    },
    summarySection: {
      content: `- 条件分岐は真か偽かで進む道を変える
- 比較式の結果は真偽値になる
- 条件の順番を先に言葉で整理すると読みやすい`,
    },
  }),
  createAuthoredLesson({
    slug: "loops",
    title: "反復",
    summary:
      "同じ処理を繰り返す理由と、更新・終了条件を意識して `while` と `for` を読めるようになる。",
    estimatedMinutes: 22,
    explanationSections: [
      {
        title: "同じ処理は反復でまとめる",
        content: `同じ形の処理を何度も書くと、長くなり、直す場所も増えます。そのため反復を使って一つにまとめます。

\`\`\`rust
fn main() {
    for n in 1..=5 {
        println!("{}", n);
    }
}
\`\`\`

「何を繰り返すか」と「何回繰り返すか」を分けて見るのが基本です。`,
      },
      {
        title: "while は条件が真の間だけ続く",
        content: `\`while\` は条件が真の間、処理を続けます。終わるには、どこかで条件が偽になる必要があります。

\`\`\`rust
fn main() {
    let mut count = 3;

    while count > 0 {
        println!("{}", count);
        count -= 1;
    }
}
\`\`\`

更新を忘れると、同じ状態のまま止まらなくなります。`,
      },
      {
        title: "反復では更新と終了条件を確認する",
        content: `反復を読むときは、次の 3 点を毎回確認してください。

- 何を繰り返しているか
- 何を更新しているか
- どの条件で止まるか

この 3 点を口で説明できないときは、まだコードの意味を追い切れていません。`,
      },
    ],
    quiz: {
      question: "反復で処理が止まらなくなる主な原因として近いものはどれですか。",
      options: [
        "終了条件を偽にする更新がない",
        "変数名が長すぎる",
        "出力が 1 行しかない",
        "関数を使っている",
      ],
      correctIndex: 0,
      explanation:
        "反復では更新と終了条件がそろって初めて止まります。更新を忘れると無限に続きやすくなります。",
    },
    sandbox: {
      prompt:
        "カウントを減らしながら表示し、更新と終了条件の関係を確認します。",
      starterCode: `fn main() {
    let mut count = 5;

    while count > 0 {
        println!("{}", count);
        count -= 1;
    }
}
`,
      stdin: "",
      successMode: "compile",
    },
    summarySection: {
      content: `- 同じ処理は反復でまとめる
- ` + "`while`" + ` は条件が真の間だけ続く
- 更新と終了条件を必ずセットで考える`,
    },
  }),
  createAuthoredLesson({
    slug: "functions-basics",
    title: "関数",
    summary:
      "処理を名前付きのまとまりへ分ける目的を理解し、引数と戻り値のある関数を読めるようになる。",
    estimatedMinutes: 24,
    explanationSections: [
      {
        title: "関数は処理に名前を付ける仕組み",
        content: `同じ処理が何度も出てきたり、意味のあるまとまりとして分けたいときは、関数にします。名前が付くと、処理の意図が読みやすくなります。

\`\`\`rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}
\`\`\`

「何をするか」を一言で言える処理は、関数に向いています。`,
      },
      {
        title: "引数は入力、戻り値は結果",
        content: `関数の外から値を渡す場所が引数です。関数が返す結果が戻り値です。

\`\`\`rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    let total = add(3, 5);
    println!("{}", total);
}
\`\`\`

呼び出す側は「何を渡すか」、関数の中では「何を返すか」を意識します。`,
      },
      {
        title: "名前で処理の意図を伝える",
        content: `関数の中身を読む前に、名前から役割が伝わるのが理想です。` + "`do_work`" + ` より ` + "`calc_total`" + ` のほうが意図が伝わりやすい、という感覚を持ってください。

初学者のうちは、短さより意味の伝わる名前を優先したほうが、読み返したときに助かります。`,
      },
    ],
    quiz: {
      question: "関数の引数に最も近い説明はどれですか。",
      options: [
        "関数へ渡す入力",
        "画面へ表示する出力",
        "コンパイルエラーの種類",
        "変数名を省略する記法",
      ],
      correctIndex: 0,
      explanation:
        "引数は関数へ渡す入力です。関数の外から中へ渡す値だと考えると整理しやすくなります。",
    },
    sandbox: {
      prompt:
        "小さな関数を作り、引数を受け取って結果を返す流れを確かめます。",
      starterCode: `fn calc_area(width: i32, height: i32) -> i32 {
    width * height
}

fn main() {
    let area = calc_area(3, 4);
    println!("{}", area);
}
`,
      stdin: "",
      successMode: "compile",
    },
    summarySection: {
      content: `- 関数は処理に名前を付ける仕組み
- 引数は入力、戻り値は結果
- 名前だけで役割が伝わる関数を目指す`,
    },
  }),
  createAuthoredLesson({
    slug: "arrays-and-strings",
    title: "配列・文字列",
    summary:
      "同じ型の値をまとめる配列と、文字の並びとしての文字列を区別して扱えるようになる。",
    estimatedMinutes: 24,
    explanationSections: [
      {
        title: "配列は同じ型の値を順番に並べたもの",
        content: `配列は、同じ型の値を順番付きでまとめる仕組みです。個数が決まっているデータを扱うとき、ひとまとまりにできます。

\`\`\`rust
fn main() {
    let scores = [72, 84, 91];
    println!("{}", scores[0]);
    println!("{}", scores[2]);
}
\`\`\`

添字は 0 から始まります。1 番目の要素を取りたいときでも ` + "`[0]`" + ` です。`,
      },
      {
        title: "文字列は文字の並びを表す",
        content: `文字列は文章や名前のようなテキストを扱うための値です。配列のように見えても、役割は違います。

\`\`\`rust
fn main() {
    let title = "Rust Dojo";
    println!("{}", title);
}
\`\`\`

配列が「同じ型の値の集まり」なら、文字列は「文字の並びを表す値」です。まずはこの違いを区別して読めれば十分です。`,
      },
      {
        title: "配列と文字列を混同しない",
        content: `どちらも並びに見えるため、最初は混同しやすい分野です。迷ったら「何を 1 つの要素として扱いたいか」を考えてください。

- 点数を並べるなら配列
- 名前や文章を扱うなら文字列

どの型をまとめたいかが決まると、使う道具も自然に決まります。`,
      },
    ],
    quiz: {
      question: "配列と文字列の違いとして適切なものはどれですか。",
      options: [
        "配列は同じ型の値の並び、文字列はテキストを表す",
        "配列は CPU だけが使え、文字列はメモリだけが使える",
        "配列は必ず 1 文字だけを持ち、文字列は必ず数値だけを持つ",
        "配列と文字列は完全に同じもので、名前だけが違う",
      ],
      correctIndex: 0,
      explanation:
        "配列は値の集まり、文字列はテキストです。見た目ではなく用途で区別します。",
    },
    sandbox: {
      prompt:
        "配列の要素を取り出し、文字列も一緒に表示して違いを確かめます。",
      starterCode: `fn main() {
    let scores = [72, 84, 91];
    let title = "Rust Dojo";

    println!("first score = {}", scores[0]);
    println!("title = {}", title);
}
`,
      stdin: "",
      successMode: "compile",
    },
    summarySection: {
      content: `- 配列は同じ型の値を順番付きでまとめる
- 文字列はテキストを表す
- 何を 1 つの要素として扱いたいかで道具を選ぶ`,
    },
  }),
  createAuthoredLesson({
    slug: "debugging-basics",
    title: "デバッグ",
    summary:
      "コンパイルエラー、間違った出力、途中停止を切り分け、原因へ近づく順番を理解する。",
    estimatedMinutes: 20,
    explanationSections: [
      {
        title: "不具合の種類を分けて考える",
        content: `デバッグは、起きている問題の種類を見分けるところから始まります。最初に分けるだけでも、見るべき場所がかなり絞れます。

- コンパイルできない
- 実行はできるが答えが違う
- 特定の入力で止まる

種類が違えば、直し方も違います。全部を一度に追わないのが大切です。`,
      },
      {
        title: "小さい入力で再現する",
        content: `答えが違うときは、まず小さい入力で再現してみます。入力を小さくすると、途中の値を追いやすくなります。

たとえば 100 個のデータで壊れるプログラムより、3 個のデータで同じ問題が起きる形へ絞れたほうが原因へ近づきやすくなります。`,
      },
      {
        title: "途中の値を表示して仮説を確かめる",
        content: `Rust では ` + "`println!`" + ` を使って途中の値を表示できます。何がずれているか分からないときは、値を観察して仮説を立てます。

\`\`\`rust
println!("count = {}", count);
\`\`\`

一度に大きく直すのではなく、1 か所ずつ見ていくほうが結果的に早く直せます。`,
      },
    ],
    quiz: {
      question: "出力が想定と違うとき、最初の行動として適切なものはどれですか。",
      options: [
        "小さい入力で再現し、途中の値を観察する",
        "複数の場所を一気に書き換える",
        "エラーメッセージを読まずに再実行する",
        "問題文を無視して勘で条件を増やす",
      ],
      correctIndex: 0,
      explanation:
        "小さい入力と途中の値の確認は、原因を切り分ける基本です。最初にそこへ戻る癖を付けます。",
    },
    sandbox: {
      prompt:
        "途中の値を表示しながら、どの時点で想定が変わるかを確認する練習です。",
      starterCode: `fn main() {
    let price = 1200;
    let rate = 20;
    let discount = price * rate / 100;
    let result = price - discount;

    println!("discount = {}", discount);
    println!("result = {}", result);
}
`,
      stdin: "",
      successMode: "compile",
    },
    summarySection: {
      content: `- まず不具合の種類を分ける
- 小さい入力で再現すると追いやすい
- 途中の値を表示して仮説を確かめる`,
    },
  }),
  createAuthoredLesson({
    slug: "intro-to-complexity",
    title: "計算量入門",
    summary:
      "入力サイズが大きくなったときの手数の増え方を直感で捉え、線形と二重ループの差を説明できるようになる。",
    estimatedMinutes: 20,
    explanationSections: [
      {
        title: "計算量は手数の増え方を見る考え方",
        content: `計算量は、入力が大きくなったときに手数がどう増えるかを見る考え方です。ここでは難しい記号を覚えるより、増え方の差を感じ取ることを優先します。

たとえば、1 件ずつ調べる処理なら、データが 2 倍になると手数もだいたい 2 倍になります。`,
      },
      {
        title: "入れ子の反復は増え方が急になる",
        content: `反復が 2 重になると、外側と内側の回数が掛け合わさります。

\`\`\`rust
fn main() {
    let n = 3;
    let mut count = 0;

    for _i in 0..n {
        for _j in 0..n {
            count += 1;
        }
    }

    println!("{}", count);
}
\`\`\`

このコードは ` + "`n * n`" + ` 回ぶんの手数になります。入力が少し増えただけでも、急に重くなる理由はここにあります。`,
      },
      {
        title: "今は線形と二重ループの差が分かれば十分",
        content: `この段階で大切なのは、次の 2 つを説明できることです。

- 1 回ずつ調べる処理は、データ量に比例して増えやすい
- 二重ループは、それより速く重くなりやすい

後で競技プログラミングを学ぶとき、この直感が制約を見る力につながります。`,
      },
    ],
    quiz: {
      question: "二重ループの処理で、入力サイズが 2 倍になったときの説明として近いものはどれですか。",
      options: [
        "手数はだいたい 4 倍になりやすい",
        "手数は必ず半分になる",
        "手数はまったく変わらない",
        "出力だけが増えて処理回数は増えない",
      ],
      correctIndex: 0,
      explanation:
        "二重ループは回数が掛け合わさるので、入力が 2 倍なら手数は 4 倍近くまで増えやすくなります。",
    },
    sandbox: {
      prompt:
        "二重ループの回数を数え、`n` を変えたときに手数がどう増えるかを観察します。",
      starterCode: `fn main() {
    let n = 3;
    let mut count = 0;

    for _i in 0..n {
        for _j in 0..n {
            count += 1;
        }
    }

    println!("count = {}", count);
}
`,
      stdin: "",
      successMode: "compile",
    },
    summarySection: {
      content: `- 計算量は手数の増え方を見る考え方
- 線形と二重ループでは増え方が違う
- 制約を見る前提として、まず直感を作る`,
    },
  }),
  createAuthoredLesson({
    slug: "input-and-output",
    title: "入出力",
    summary:
      "標準入力を文字列で受け取り、整形して数値へ変換し、`println!` で出力する基本形を身に付ける。",
    estimatedMinutes: 24,
    explanationSections: [
      {
        title: "入力はまず文字列として受け取る",
        content: `Rust では、標準入力を最初から数値として受け取るのではなく、いったん文字列へ読み込みます。

\`\`\`rust
use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
}
\`\`\`

この形を最初に覚えておくと、後で 1 個でも複数個でも応用しやすくなります。`,
      },
      {
        title: "改行を取り除いてから数値へ変換する",
        content: `入力の末尾には改行が含まれることが多いので、数値に変換する前に ` + "`trim()`" + ` を使います。

\`\`\`rust
let n: i32 = input.trim().parse().unwrap();
\`\`\`

` + "`trim()`" + ` は余分な空白や改行を落とすための前処理です。ここを忘れると、変換エラーの原因になります。`,
      },
      {
        title: "出力は println! を基本形にする",
        content: `結果を 1 行で返したいときは ` + "`println!`" + ` を使います。学習中の演習でもっとも多く使う出力方法です。

\`\`\`rust
println!("{}", n * 2);
\`\`\`

入出力は慣れの比重が大きい分野です。最初の型を毎回同じように書けるようになると、問題を解くときの負担が大きく減ります。`,
      },
    ],
    quiz: {
      question: "標準入力を数値に変換する前によく行う処理はどれですか。",
      options: [
        "`trim()` で余分な改行や空白を取り除く",
        "必ず二重ループを入れる",
        "出力を先に 3 回書いておく",
        "変数名をすべて 1 文字にする",
      ],
      correctIndex: 0,
      explanation:
        "入力の末尾に改行が入ることが多いので、数値へ変換する前に `trim()` を挟むのが基本です。",
    },
    sandbox: {
      prompt:
        "1 つの整数を読み取り、2 倍して表示する最小構成を動かします。",
      starterCode: `use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();

    let n: i32 = input.trim().parse().unwrap();
    println!("{}", n * 2);
}
`,
      stdin: "7\n",
      successMode: "compile",
    },
    summarySection: {
      content: `- 入力はまず文字列で受け取る
- 数値へ変換する前に ` + "`trim()`" + ` を挟む
- 1 行出力の基本は ` + "`println!`" + ` である`,
    },
  }),
];
