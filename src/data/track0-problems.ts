import type { ProblemData } from "./problem-shared";

export const track0Problems: ProblemData[] = [
  {
    id: "hello-world",
    title: "Hello, World!",
    difficulty: "easy",
    tags: ["入門", "出力"],
    trackCode: "track0",
    relatedLessonSlugs: ["what-is-program"],
    kind: "implementation",
    estimatedMinutes: 5,
    statement: `## 問題

標準出力に \`Hello, World!\` と 1 行だけ出力してください。

この問題では入力はありません。`,
    outputFormat: "`Hello, World!` を 1 行で出力する",
    hintText:
      "文字列を 1 行出力するときは `println!` を使います。",
    explanationText:
      "`println!(\"Hello, World!\");` を `main` 関数の中へ書けば解けます。最初の 1 問として、書いた命令がそのまま実行される感覚をつかむのが目的です。",
    initialCode: `fn main() {
    // ここに 1 行追加する
}
`,
    testCases: [
      {
        input: "",
        expectedOutput: "Hello, World!\n",
        isHidden: false,
      },
    ],
  },
  {
    id: "let-mut-counter",
    title: "コンパイルを通す: カウンタ",
    difficulty: "easy",
    tags: ["変数", "mut", "コンパイルエラー"],
    trackCode: "track0",
    relatedLessonSlugs: ["values-and-variables"],
    kind: "compile_error_fix",
    estimatedMinutes: 8,
    statement: `## 問題

次のコードは、カウンタを 1 増やして表示したいプログラムです。

そのままではコンパイルエラーになります。コンパイルが通り、標準出力に \`1\` と表示されるように修正してください。`,
    outputFormat: "`1` を 1 行で出力する",
    hintText:
      "値をあとから変更する変数には、宣言時に `mut` が必要です。",
    explanationText:
      "Rust の変数は既定で変更できません。`count += 1;` をしたいなら、`let mut count = 0;` の形に直す必要があります。",
    initialCode: `fn main() {
    let count = 0;
    count += 1;
    println!("{}", count);
}
`,
    testCases: [
      {
        input: "",
        expectedOutput: "1\n",
        isHidden: false,
      },
    ],
  },
  {
    id: "minutes-and-seconds",
    title: "秒を分と秒に分ける",
    difficulty: "easy",
    tags: ["型", "整数", "算術"],
    trackCode: "track0",
    relatedLessonSlugs: ["types-and-representation"],
    kind: "implementation",
    estimatedMinutes: 10,
    statement: `## 問題

整数 \`S\` が与えられます。これは合計の秒数です。

\`S\` 秒を「何分何秒か」に分け、\`minutes seconds\` の形で出力してください。`,
    constraintsText: `- 0 <= S <= 100000`,
    inputFormat: `1 行で整数 \`S\` が与えられる`,
    outputFormat: `分を表す整数と秒を表す整数を空白区切りで 1 行に出力する`,
    hintText:
      "60 秒で 1 分です。分は割り算、残り秒は余りで求められます。",
    explanationText:
      "`minutes = s / 60`、`seconds = s % 60` で求められます。整数型の割り算と余りを使う練習問題です。",
    initialCode: `use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let s: i32 = input.trim().parse().unwrap();

    // 分と秒を求めて出力する
}
`,
    testCases: [
      { input: "130\n", expectedOutput: "2 10\n", isHidden: false },
      { input: "59\n", expectedOutput: "0 59\n", isHidden: false },
      { input: "600\n", expectedOutput: "10 0\n", isHidden: true },
    ],
  },
  {
    id: "max-of-three",
    title: "3 つの値の最大値",
    difficulty: "easy",
    tags: ["条件分岐", "比較"],
    trackCode: "track0",
    relatedLessonSlugs: ["condition-branches"],
    kind: "implementation",
    estimatedMinutes: 10,
    statement: `## 問題

3 つの整数 \`A\`, \`B\`, \`C\` が与えられます。

3 つのうち最も大きい値を 1 行で出力してください。`,
    constraintsText: `- -1000 <= A, B, C <= 1000`,
    inputFormat: `1 行で \`A B C\` が空白区切りで与えられる`,
    outputFormat: `最大値を 1 行で出力する`,
    hintText:
      "まず \`A\` を最大値候補として持ち、もっと大きい値があれば更新していくと考えやすくなります。",
    explanationText:
      "最大値候補を 1 つ決めてから比較すると整理しやすくなります。`if` を 2 回使ってもよいですし、入れ子の条件分岐でも解けます。",
    initialCode: `use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let nums: Vec<i32> = input
        .split_whitespace()
        .map(|s| s.parse().unwrap())
        .collect();

    // 最大値を求めて出力する
}
`,
    testCases: [
      { input: "3 9 5\n", expectedOutput: "9\n", isHidden: false },
      { input: "-4 -8 -1\n", expectedOutput: "-1\n", isHidden: false },
      { input: "7 7 2\n", expectedOutput: "7\n", isHidden: true },
    ],
  },
  {
    id: "sum-to-n",
    title: "1 から N までの和",
    difficulty: "easy",
    tags: ["反復", "算術"],
    trackCode: "track0",
    relatedLessonSlugs: ["loops"],
    kind: "implementation",
    estimatedMinutes: 10,
    statement: `## 問題

整数 \`N\` が与えられます。

\`1\` から \`N\` までの和を求めて、1 行で出力してください。`,
    constraintsText: `- 1 <= N <= 1000`,
    inputFormat: `1 行で整数 \`N\` が与えられる`,
    outputFormat: `1 から N までの和を 1 行で出力する`,
    hintText:
      "合計を入れる変数を用意し、`for` か `while` で 1 から順に足していきます。",
    explanationText:
      "反復では、何を繰り返すかと何を更新するかを分けて考えます。この問題では、`sum` を更新しながら 1 から `N` まで回せば解けます。",
    initialCode: `use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let n: i32 = input.trim().parse().unwrap();

    // 1 から n までの和を求める
}
`,
    testCases: [
      { input: "4\n", expectedOutput: "10\n", isHidden: false },
      { input: "10\n", expectedOutput: "55\n", isHidden: false },
      { input: "1\n", expectedOutput: "1\n", isHidden: true },
    ],
  },
  {
    id: "rectangle-area",
    title: "長方形の面積を関数で求める",
    difficulty: "easy",
    tags: ["関数", "引数", "戻り値"],
    trackCode: "track0",
    relatedLessonSlugs: ["functions-basics"],
    kind: "implementation",
    estimatedMinutes: 12,
    statement: `## 問題

整数 \`width\` と \`height\` が与えられます。

関数 \`calc_area\` を実装し、長方形の面積を求めて出力してください。`,
    constraintsText: `- 1 <= width, height <= 1000`,
    inputFormat: `1 行で \`width height\` が空白区切りで与えられる`,
    outputFormat: `面積を 1 行で出力する`,
    hintText:
      "面積は `width * height` です。計算そのものを関数へ切り出してみてください。",
    explanationText:
      "この問題の目的は関数へ処理を分けることです。`calc_area(width, height)` が 1 つの結果を返す形にすると、`main` の仕事を小さくできます。",
    initialCode: `use std::io;

fn calc_area(width: i32, height: i32) -> i32 {
    // ここに処理を書く
}

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let nums: Vec<i32> = input
        .split_whitespace()
        .map(|s| s.parse().unwrap())
        .collect();

    println!("{}", calc_area(nums[0], nums[1]));
}
`,
    testCases: [
      { input: "3 4\n", expectedOutput: "12\n", isHidden: false },
      { input: "10 2\n", expectedOutput: "20\n", isHidden: false },
      { input: "1 1\n", expectedOutput: "1\n", isHidden: true },
    ],
  },
  {
    id: "word-count",
    title: "単語数カウント",
    difficulty: "easy",
    tags: ["文字列", "配列", "入力"],
    trackCode: "track0",
    relatedLessonSlugs: ["arrays-and-strings"],
    kind: "implementation",
    estimatedMinutes: 12,
    statement: `## 問題

1 行の文字列 \`S\` が与えられます。

空白で区切られた単語の数を数えて、1 行で出力してください。先頭や末尾に空白が入ることがあります。`,
    constraintsText: `- S は英小文字と空白からなる
- 1 <= S の長さ <= 200`,
    inputFormat: `1 行で文字列 \`S\` が与えられる`,
    outputFormat: `単語数を 1 行で出力する`,
    hintText:
      "`split_whitespace()` は、空白で区切られた部分を順に取り出せます。個数だけ知りたいなら `count()` が使えます。",
    explanationText:
      "文字列を空白で分けてから個数を数えます。文字そのものを 1 文字ずつ数えるのではなく、「空白で区切られた単語の並び」として考えるのがポイントです。",
    initialCode: `use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();

    let count = input.split_whitespace().count();
    println!("{}", count);
}
`,
    testCases: [
      {
        input: "rust dojo practice\n",
        expectedOutput: "3\n",
        isHidden: false,
      },
      {
        input: "  one   two  \n",
        expectedOutput: "2\n",
        isHidden: false,
      },
      {
        input: "single\n",
        expectedOutput: "1\n",
        isHidden: true,
      },
    ],
  },
  {
    id: "fix-total-score",
    title: "コンパイルを通す: 合計点",
    difficulty: "easy",
    tags: ["デバッグ", "コンパイルエラー", "配列"],
    trackCode: "track0",
    relatedLessonSlugs: ["debugging-basics"],
    kind: "compile_error_fix",
    estimatedMinutes: 10,
    statement: `## 問題

次のコードは、3 つの点数の合計を表示したいプログラムです。

そのままではコンパイルエラーになります。コンパイルが通り、3 つの点数の合計を出力するように修正してください。`,
    constraintsText: `- 0 <= 各点数 <= 100`,
    inputFormat: `1 行で 3 つの整数が空白区切りで与えられる`,
    outputFormat: `合計点を 1 行で出力する`,
    hintText:
      "コンパイラが指摘する行を見て、使っている変数名に表記ゆれがないか確認してください。",
    explanationText:
      "この問題ではロジックより先に、コンパイルエラーを読む姿勢が大切です。エラーメッセージが示す変数名を見直すと、修正箇所が絞れます。",
    initialCode: `use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let scores: Vec<i32> = input
        .split_whitespace()
        .map(|s| s.parse().unwrap())
        .collect();

    let total = scores[0] + score[1] + scores[2];
    println!("{}", total);
}
`,
    testCases: [
      { input: "30 40 20\n", expectedOutput: "90\n", isHidden: false },
      { input: "10 10 10\n", expectedOutput: "30\n", isHidden: false },
      { input: "0 100 0\n", expectedOutput: "100\n", isHidden: true },
    ],
  },
  {
    id: "first-over-target",
    title: "しきい値以上の最初の位置",
    difficulty: "easy",
    tags: ["計算量", "線形探索", "配列"],
    trackCode: "track0",
    relatedLessonSlugs: ["intro-to-complexity", "arrays-and-strings"],
    kind: "implementation",
    estimatedMinutes: 14,
    statement: `## 問題

整数 \`N\`, \`X\` と、長さ \`N\` の整数列 \`A\` が与えられます。

\`A\` の中で \`X\` 以上になる最初の要素の位置を、1 始まりで出力してください。見つからない場合は \`-1\` を出力してください。`,
    constraintsText: `- 1 <= N <= 100
- -1000 <= A_i, X <= 1000`,
    inputFormat: `1 行目に \`N X\`
2 行目に \`A_1 A_2 ... A_N\``,
    outputFormat: `条件を満たす最初の位置を 1 行で出力する。見つからない場合は \`-1\` を出力する`,
    hintText:
      "左から順に 1 つずつ調べれば十分です。見つかった時点で答えを出して終えてかまいません。",
    explanationText:
      "この問題は線形探索の基本です。左から順に見るので手数は `N` に比例します。複雑な方法を考える前に、まず 1 回ずつ調べる発想を固めるのが目的です。",
    initialCode: `use std::io;

fn main() {
    let mut first = String::new();
    io::stdin().read_line(&mut first).unwrap();
    let header: Vec<i32> = first
        .split_whitespace()
        .map(|s| s.parse().unwrap())
        .collect();
    let n = header[0] as usize;
    let x = header[1];

    let mut second = String::new();
    io::stdin().read_line(&mut second).unwrap();
    let values: Vec<i32> = second
        .split_whitespace()
        .map(|s| s.parse().unwrap())
        .collect();

    // 左から順に調べる
}
`,
    testCases: [
      { input: "5 7\n2 4 7 6 9\n", expectedOutput: "3\n", isHidden: false },
      { input: "4 10\n1 2 3 4\n", expectedOutput: "-1\n", isHidden: false },
      { input: "6 5\n5 8 9 1 2 3\n", expectedOutput: "1\n", isHidden: true },
    ],
  },
  {
    id: "aplusb",
    title: "A + B",
    difficulty: "easy",
    tags: ["入出力", "算術"],
    trackCode: "track0",
    relatedLessonSlugs: ["input-and-output"],
    kind: "implementation",
    estimatedMinutes: 8,
    statement: `## 問題

2 つの整数 \`A\`, \`B\` が与えられます。

\`A + B\` を求めて、1 行で出力してください。`,
    constraintsText: `- 1 <= A, B <= 1000`,
    inputFormat: `1 行で \`A B\` が空白区切りで与えられる`,
    outputFormat: `A + B の値を 1 行で出力する`,
    hintText:
      "入力を空白で分けて数値へ変換し、2 つを足して `println!` で出力します。",
    explanationText:
      "入出力の最小構成を練習する問題です。文字列で受け取る、空白で分ける、数値へ変換する、結果を出力する、の 4 段階に分けると整理しやすくなります。",
    initialCode: `use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let nums: Vec<i32> = input
        .split_whitespace()
        .map(|s| s.parse().unwrap())
        .collect();

    // A + B を出力する
}
`,
    testCases: [
      { input: "3 5\n", expectedOutput: "8\n", isHidden: false },
      { input: "100 200\n", expectedOutput: "300\n", isHidden: false },
      { input: "999 1\n", expectedOutput: "1000\n", isHidden: true },
    ],
  },
];
