// 演習問題のデータ定義
// MVP ではハードコード。将来 DB に移行する。

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export type ProblemKind =
  | "implementation"
  | "compile_error_fix"
  | "ownership_fix";

export interface ProblemData {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  trackCode: string;
  relatedLessonSlugs: string[];
  kind: ProblemKind;
  estimatedMinutes: number;
  statement: string; // Markdown
  constraintsText?: string;
  inputFormat?: string;
  outputFormat?: string;
  hintText?: string;
  explanationText?: string;
  initialCode: string;
  testCases: TestCase[];
}

export const problems: ProblemData[] = [
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

標準出力に \`Hello, World!\` と出力してください。

## 出力

\`\`\`
Hello, World!
\`\`\`
`,
    initialCode: `fn main() {
    // ここにコードを書く
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
    id: "aplusb",
    title: "A + B",
    difficulty: "easy",
    tags: ["入門", "入力", "算術"],
    trackCode: "track0",
    relatedLessonSlugs: ["input-and-output"],
    kind: "implementation",
    estimatedMinutes: 8,
    statement: `## 問題

2 つの整数 A, B が与えられます。A + B を出力してください。

## 入力

\`\`\`
A B
\`\`\`

- 1 ≤ A, B ≤ 1000

## 出力

A + B の値を 1 行で出力してください。

## 入力例

\`\`\`
3 5
\`\`\`

## 出力例

\`\`\`
8
\`\`\`
`,
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

3 つの整数 A, B, C が与えられます。最大の値を出力してください。

## 入力

\`\`\`
A B C
\`\`\`

- -1000 ≤ A, B, C ≤ 1000

## 出力

最大値を 1 行で出力してください。

## 入力例

\`\`\`
3 9 5
\`\`\`

## 出力例

\`\`\`
9
\`\`\`
`,
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

整数 N が与えられます。1 から N までの和を出力してください。

## 入力

\`\`\`
N
\`\`\`

- 1 ≤ N ≤ 1000

## 出力

1 から N までの和を 1 行で出力してください。

## 入力例

\`\`\`
4
\`\`\`

## 出力例

\`\`\`
10
\`\`\`
`,
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
    id: "word-count",
    title: "単語数カウント",
    difficulty: "easy",
    tags: ["文字列", "入力"],
    trackCode: "track0",
    relatedLessonSlugs: ["arrays-and-strings", "input-and-output"],
    kind: "implementation",
    estimatedMinutes: 10,
    statement: `## 問題

1 行の文字列 S が与えられます。空白で区切られた単語の数を出力してください。

## 入力

\`\`\`
S
\`\`\`

- S は英字と空白からなる
- 先頭や末尾に空白が入ることがある

## 出力

単語数を 1 行で出力してください。

## 入力例

\`\`\`
rust dojo practice
\`\`\`

## 出力例

\`\`\`
3
\`\`\`
`,
    initialCode: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();

    // 単語数を数えて出力する
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
    id: "mutable-counter",
    title: "コンパイルを通す: カウンタ",
    difficulty: "easy",
    tags: ["let", "mut", "コンパイルエラー"],
    trackCode: "track1",
    relatedLessonSlugs: ["let-and-mut"],
    kind: "compile_error_fix",
    estimatedMinutes: 8,
    statement: `## 問題

次のコードは、カウンタを 1 増やして表示したいプログラムですが、そのままではコンパイルエラーになります。

コンパイルが通り、標準出力に \`1\` と表示されるように修正してください。

## 出力

\`\`\`
1
\`\`\`
`,
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
    id: "discount-price",
    title: "割引後の価格",
    difficulty: "easy",
    tags: ["関数", "算術"],
    trackCode: "track1",
    relatedLessonSlugs: ["functions"],
    kind: "implementation",
    estimatedMinutes: 10,
    statement: `## 問題

整数 price と rate が与えられます。関数 \`apply_discount\` を実装し、割引後の価格を出力してください。

割引後の価格は \`price - price * rate / 100\` で求めます。

## 入力

\`\`\`
price rate
\`\`\`

## 出力

割引後の価格を 1 行で出力してください。

## 入力例

\`\`\`
1200 25
\`\`\`

## 出力例

\`\`\`
900
\`\`\`
`,
    initialCode: `use std::io;

fn apply_discount(price: i32, rate: i32) -> i32 {
    // ここに処理を書く
}

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let nums: Vec<i32> = input
        .split_whitespace()
        .map(|s| s.parse().unwrap())
        .collect();

    println!("{}", apply_discount(nums[0], nums[1]));
}
`,
    testCases: [
      { input: "1200 25\n", expectedOutput: "900\n", isHidden: false },
      { input: "500 10\n", expectedOutput: "450\n", isHidden: false },
      { input: "999 0\n", expectedOutput: "999\n", isHidden: true },
    ],
  },
  {
    id: "fizzbuzz",
    title: "FizzBuzz",
    difficulty: "easy",
    tags: ["条件分岐", "反復"],
    trackCode: "track1",
    relatedLessonSlugs: ["control-flow"],
    kind: "implementation",
    estimatedMinutes: 12,
    statement: `## 問題

整数 N が与えられます。1 から N まで、次の規則で各行に出力してください。

- 3 の倍数かつ 5 の倍数なら \`FizzBuzz\`
- 3 の倍数なら \`Fizz\`
- 5 の倍数なら \`Buzz\`
- それ以外は数値そのもの

## 入力

\`\`\`
N
\`\`\`

- 1 ≤ N ≤ 100

## 入力例

\`\`\`
15
\`\`\`

## 出力例

\`\`\`
1
2
Fizz
4
Buzz
Fizz
7
8
Fizz
Buzz
11
Fizz
13
14
FizzBuzz
\`\`\`
`,
    initialCode: `use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let n: i32 = input.trim().parse().unwrap();

    // 1 から n まで FizzBuzz を出力する
}
`,
    testCases: [
      {
        input: "15\n",
        expectedOutput:
          "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n",
        isHidden: false,
      },
      {
        input: "3\n",
        expectedOutput: "1\n2\nFizz\n",
        isHidden: false,
      },
      {
        input: "5\n",
        expectedOutput: "1\n2\nFizz\n4\nBuzz\n",
        isHidden: true,
      },
    ],
  },
  {
    id: "ownership-swap",
    title: "参照で値を入れ替える",
    difficulty: "medium",
    tags: ["参照", "借用", "関数"],
    trackCode: "track1",
    relatedLessonSlugs: ["references-and-borrowing"],
    kind: "ownership_fix",
    estimatedMinutes: 12,
    statement: `## 問題

2 つの \`i32\` を受け取り、可変参照を使って値を入れ替える関数 \`swap_values\` を実装してください。

## 入力

\`\`\`
A B
\`\`\`

## 出力

入れ替えた後の値を \`B A\` の形で 1 行に出力してください。

## 入力例

\`\`\`
10 20
\`\`\`

## 出力例

\`\`\`
20 10
\`\`\`
`,
    initialCode: `use std::io;

fn swap_values(a: &mut i32, b: &mut i32) {
    // ここに入れ替えの処理を書く
}

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let nums: Vec<i32> = input
        .split_whitespace()
        .map(|s| s.parse().unwrap())
        .collect();

    let mut a = nums[0];
    let mut b = nums[1];
    swap_values(&mut a, &mut b);
    println!("{} {}", a, b);
}
`,
    testCases: [
      { input: "10 20\n", expectedOutput: "20 10\n", isHidden: false },
      { input: "0 0\n", expectedOutput: "0 0\n", isHidden: false },
      { input: "-5 100\n", expectedOutput: "100 -5\n", isHidden: true },
    ],
  },
  {
    id: "first-word-slice",
    title: "最初の単語を切り出す",
    difficulty: "medium",
    tags: ["スライス", "文字列"],
    trackCode: "track1",
    relatedLessonSlugs: ["slices"],
    kind: "implementation",
    estimatedMinutes: 12,
    statement: `## 問題

文字列 S が与えられます。関数 \`first_word\` を実装し、最初の空白までの部分文字列を出力してください。

空白を含まない場合は文字列全体を返してください。

## 入力

\`\`\`
S
\`\`\`

## 出力

最初の単語を 1 行で出力してください。

## 入力例

\`\`\`
rust dojo
\`\`\`

## 出力例

\`\`\`
rust
\`\`\`
`,
    initialCode: `use std::io::{self, Read};

fn first_word(s: &str) -> &str {
    // ここに処理を書く
}

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let s = input.trim_end();
    println!("{}", first_word(s));
}
`,
    testCases: [
      {
        input: "rust dojo\n",
        expectedOutput: "rust\n",
        isHidden: false,
      },
      {
        input: "single\n",
        expectedOutput: "single\n",
        isHidden: false,
      },
      {
        input: "borrow checker rules\n",
        expectedOutput: "borrow\n",
        isHidden: true,
      },
    ],
  },
  {
    id: "point-distance",
    title: "座標の二乗距離",
    difficulty: "medium",
    tags: ["構造体", "関数"],
    trackCode: "track1",
    relatedLessonSlugs: ["structs"],
    kind: "implementation",
    estimatedMinutes: 12,
    statement: `## 問題

平面上の座標 \`(x, y)\` が与えられます。構造体 \`Point\` を使い、原点からの二乗距離 \`x * x + y * y\` を返す関数 \`distance_sq\` を実装してください。

## 入力

\`\`\`
x y
\`\`\`

## 出力

二乗距離を 1 行で出力してください。

## 入力例

\`\`\`
3 4
\`\`\`

## 出力例

\`\`\`
25
\`\`\`
`,
    initialCode: `use std::io;

struct Point {
    x: i32,
    y: i32,
}

fn distance_sq(point: &Point) -> i32 {
    // ここに処理を書く
}

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let nums: Vec<i32> = input
        .split_whitespace()
        .map(|s| s.parse().unwrap())
        .collect();

    let point = Point {
        x: nums[0],
        y: nums[1],
    };

    println!("{}", distance_sq(&point));
}
`,
    testCases: [
      { input: "3 4\n", expectedOutput: "25\n", isHidden: false },
      { input: "0 0\n", expectedOutput: "0\n", isHidden: false },
      { input: "-2 5\n", expectedOutput: "29\n", isHidden: true },
    ],
  },
  {
    id: "signal-match",
    title: "信号の動作を判定する",
    difficulty: "hard",
    tags: ["列挙型", "match"],
    trackCode: "track1",
    relatedLessonSlugs: ["enums", "match"],
    kind: "implementation",
    estimatedMinutes: 15,
    statement: `## 問題

整数 N が与えられます。N を信号の状態に変換し、対応する動作を返す関数 \`action\` を実装してください。

- 0: 赤 → \`stop\`
- 1: 黄 → \`wait\`
- 2: 緑 → \`go\`

判定には \`match\` を使ってください。

## 入力

\`\`\`
N
\`\`\`

- N は 0, 1, 2 のいずれか

## 出力

対応する文字列を 1 行で出力してください。

## 入力例

\`\`\`
2
\`\`\`

## 出力例

\`\`\`
go
\`\`\`
`,
    initialCode: `use std::io;

enum Signal {
    Red,
    Yellow,
    Green,
}

fn parse_signal(n: i32) -> Signal {
    match n {
        0 => Signal::Red,
        1 => Signal::Yellow,
        _ => Signal::Green,
    }
}

fn action(signal: Signal) -> &'static str {
    // ここに処理を書く
}

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let n: i32 = input.trim().parse().unwrap();

    println!("{}", action(parse_signal(n)));
}
`,
    testCases: [
      { input: "2\n", expectedOutput: "go\n", isHidden: false },
      { input: "0\n", expectedOutput: "stop\n", isHidden: false },
      { input: "1\n", expectedOutput: "wait\n", isHidden: true },
    ],
  },
  {
    id: "atcoder-aplusb",
    title: "AtCoder 形式の A + B",
    difficulty: "easy",
    tags: ["AtCoder", "入力", "算術"],
    trackCode: "track3",
    relatedLessonSlugs: ["atcoder-environment", "io-template"],
    kind: "implementation",
    estimatedMinutes: 8,
    statement: `## 問題

整数 A, B が与えられます。A + B を出力してください。

AtCoder の A 問を想定した、もっとも基本的な入出力の練習です。`,
    constraintsText: `- 1 ≤ A, B ≤ 10^9`,
    inputFormat: `\`\`\`
A B
\`\`\``,
    outputFormat: `\`\`\`
A + B
\`\`\``,
    hintText: `標準入力をまとめて読み、空白区切りで 2 つの整数を取り出します。`,
    explanationText: `入力形式が単純なときほど、テンプレートをそのまま使って確実に値を取り出すのが大事です。答えだけを 1 行で出力してください。`,
    initialCode: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let mut iter = input.split_whitespace();

    let a: i64 = iter.next().unwrap().parse().unwrap();
    let b: i64 = iter.next().unwrap().parse().unwrap();

    // A + B を出力する
}
`,
    testCases: [
      { input: "3 5\n", expectedOutput: "8\n", isHidden: false },
      { input: "1000000000 7\n", expectedOutput: "1000000007\n", isHidden: false },
      { input: "11 29\n", expectedOutput: "40\n", isHidden: true },
    ],
  },
  {
    id: "vec-max-count",
    title: "最大値と個数",
    difficulty: "easy",
    tags: ["AtCoder", "Vec", "数列"],
    trackCode: "track3",
    relatedLessonSlugs: ["io-template", "vec-and-basic-data-structures"],
    kind: "implementation",
    estimatedMinutes: 12,
    statement: `## 問題

長さ N の整数列が与えられます。最大値と、その最大値が何回現れるかを出力してください。`,
    constraintsText: `- 1 ≤ N ≤ 2 × 10^5
- 1 ≤ a_i ≤ 10^9`,
    inputFormat: `\`\`\`
N
a_1 a_2 ... a_N
\`\`\``,
    outputFormat: `\`\`\`
最大値 個数
\`\`\``,
    hintText: `まず整数列を \`Vec<i64>\` に読み込みます。最大値を求めたあと、もう一度走査して個数を数えると整理しやすくなります。`,
    explanationText: `競プロでは、入力を一度 \`Vec\` に保存してから複数回走査する形がよくあります。この問題は最大値の取得と個数カウントを分けると実装が素直です。`,
    initialCode: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let mut iter = input.split_whitespace();

    let n: usize = iter.next().unwrap().parse().unwrap();
    let values: Vec<i64> = (0..n)
        .map(|_| iter.next().unwrap().parse().unwrap())
        .collect();

    // 最大値と個数を出力する
}
`,
    testCases: [
      { input: "5\n1 4 4 2 3\n", expectedOutput: "4 2\n", isHidden: false },
      { input: "4\n7 7 7 7\n", expectedOutput: "7 4\n", isHidden: false },
      { input: "6\n2 9 1 9 3 9\n", expectedOutput: "9 3\n", isHidden: true },
    ],
  },
  {
    id: "sort-integers",
    title: "整数列を昇順に並べる",
    difficulty: "easy",
    tags: ["AtCoder", "ソート", "Vec"],
    trackCode: "track3",
    relatedLessonSlugs: ["vec-and-basic-data-structures", "sorting-and-searching"],
    kind: "implementation",
    estimatedMinutes: 12,
    statement: `## 問題

長さ N の整数列を昇順に並べ替えて出力してください。`,
    constraintsText: `- 1 ≤ N ≤ 2 × 10^5
- -10^9 ≤ a_i ≤ 10^9`,
    inputFormat: `\`\`\`
N
a_1 a_2 ... a_N
\`\`\``,
    outputFormat: `\`\`\`
昇順に並べた数列
\`\`\``,
    hintText: `\`Vec\` を \`sort()\` で並べ替えたあと、空白区切りで出力します。最後だけ改行にする形を意識してください。`,
    explanationText: `ソートは競プロで最もよく使う前処理の 1 つです。並べ替えたあとの出力形式まで含めて素早く書けるようにしておくと、後続の探索問題にもつながります。`,
    initialCode: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let mut iter = input.split_whitespace();

    let n: usize = iter.next().unwrap().parse().unwrap();
    let mut values: Vec<i64> = (0..n)
        .map(|_| iter.next().unwrap().parse().unwrap())
        .collect();

    // 昇順に並べて出力する
}
`,
    testCases: [
      { input: "5\n4 1 3 2 5\n", expectedOutput: "1 2 3 4 5\n", isHidden: false },
      { input: "3\n9 9 1\n", expectedOutput: "1 9 9\n", isHidden: false },
      { input: "4\n0 -2 7 1\n", expectedOutput: "-2 0 1 7\n", isHidden: true },
    ],
  },
  {
    id: "linear-search-index",
    title: "線形探索",
    difficulty: "medium",
    tags: ["AtCoder", "探索", "Vec"],
    trackCode: "track3",
    relatedLessonSlugs: ["vec-and-basic-data-structures", "sorting-and-searching"],
    kind: "implementation",
    estimatedMinutes: 14,
    statement: `## 問題

長さ N の整数列と整数 X が与えられます。先頭から見て、最初に X が現れる位置を 1-indexed で出力してください。存在しない場合は -1 を出力してください。`,
    constraintsText: `- 1 ≤ N ≤ 2 × 10^5
- 1 ≤ a_i, X ≤ 10^9`,
    inputFormat: `\`\`\`
N X
a_1 a_2 ... a_N
\`\`\``,
    outputFormat: `\`\`\`
位置
\`\`\`

存在しない場合は \`-1\` を出力する。`,
    hintText: `\`enumerate()\` を使うと、添字と値を同時に見られます。見つかった時点でループを抜けると書きやすくなります。`,
    explanationText: `長さが大きくても、1 回だけ探すなら線形探索で十分なことがあります。まずは単純な探索を確実に書けることが大事です。`,
    initialCode: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let mut iter = input.split_whitespace();

    let n: usize = iter.next().unwrap().parse().unwrap();
    let x: i64 = iter.next().unwrap().parse().unwrap();
    let values: Vec<i64> = (0..n)
        .map(|_| iter.next().unwrap().parse().unwrap())
        .collect();

    // 最初に x が現れる位置を 1-indexed で出力する
}
`,
    testCases: [
      { input: "5 7\n1 3 7 9 7\n", expectedOutput: "3\n", isHidden: false },
      { input: "4 5\n1 2 3 4\n", expectedOutput: "-1\n", isHidden: false },
      { input: "6 2\n2 8 2 8 2 8\n", expectedOutput: "1\n", isHidden: true },
    ],
  },
  {
    id: "sum-k-bruteforce",
    title: "合計 K を作れるか",
    difficulty: "medium",
    tags: ["AtCoder", "全探索", "条件分岐"],
    trackCode: "track3",
    relatedLessonSlugs: ["sorting-and-searching", "bruteforce-basics"],
    kind: "implementation",
    estimatedMinutes: 15,
    statement: `## 問題

長さ N の整数列と整数 K が与えられます。異なる 2 要素を選んで合計 K を作れるなら \`Yes\`、作れないなら \`No\` を出力してください。`,
    constraintsText: `- 2 ≤ N ≤ 2000
- 1 ≤ a_i, K ≤ 10^9`,
    inputFormat: `\`\`\`
N K
a_1 a_2 ... a_N
\`\`\``,
    outputFormat: `\`\`\`
Yes
\`\`\`

または

\`\`\`
No
\`\`\``,
    hintText: `制約が 2000 なので、2 重ループで全ての組を調べても間に合います。まずは全探索で条件を満たすか確かめます。`,
    explanationText: `競プロでは、最適化の前に制約を見ることが重要です。この問題は 2 重ループの全探索で十分通るため、候補を漏れなく調べることに集中できます。`,
    initialCode: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let mut iter = input.split_whitespace();

    let n: usize = iter.next().unwrap().parse().unwrap();
    let k: i64 = iter.next().unwrap().parse().unwrap();
    let values: Vec<i64> = (0..n)
        .map(|_| iter.next().unwrap().parse().unwrap())
        .collect();

    // 2 要素の合計で k を作れるか調べる
}
`,
    testCases: [
      { input: "4 10\n1 3 7 9\n", expectedOutput: "Yes\n", isHidden: false },
      { input: "5 20\n1 2 3 4 5\n", expectedOutput: "No\n", isHidden: false },
      { input: "6 11\n8 1 6 4 10 3\n", expectedOutput: "Yes\n", isHidden: true },
    ],
  },
];

export function getProblem(id: string): ProblemData | undefined {
  return problems.find((problem) => problem.id === id);
}

export function getProblems(filters?: {
  difficulty?: string;
  tag?: string;
}): ProblemData[] {
  let result = problems;
  if (filters?.difficulty) {
    result = result.filter((problem) => problem.difficulty === filters.difficulty);
  }
  if (filters?.tag) {
    const tag = filters.tag;
    result = result.filter((problem) => problem.tags.includes(tag));
  }
  return result;
}
