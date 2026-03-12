// 学習コンテンツのデータ定義
// MVP 段階ではハードコード。将来的に DB + CMS に移行する。

export interface LessonData {
  slug: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  content: string; // Markdown
}

export interface TrackData {
  code: string;
  label: string;
  name: string;
  description: string;
  gradient: string;
  availability: "available" | "coming_soon";
  roadmapTopics: string[];
  launchNote?: string;
  lessons: LessonData[];
}

export const tracks: TrackData[] = [
  {
    code: "track0",
    label: "Track 0",
    name: "プログラミング前提",
    description:
      "コンピュータの基本から、変数、型、メモリ、制御構文、デバッグ、入出力までを順に学ぶ。",
    gradient: "from-emerald-600 to-teal-600",
    availability: "available",
    roadmapTopics: [
      "コンピュータとは何か",
      "プログラムとは何か",
      "値と変数",
      "型",
      "メモリ",
      "条件分岐",
      "反復",
      "関数",
      "配列・文字列",
      "デバッグ",
      "計算量入門",
      "入出力",
    ],
    lessons: [
      {
        slug: "what-is-computer",
        title: "コンピュータとは何か",
        summary:
          "CPU、メモリ、ストレージの役割と、プログラムが動く仕組みを理解する。",
        estimatedMinutes: 10,
        content: `## コンピュータの構成

コンピュータは大きく分けて 3 つの部品で構成されている。

- **CPU** は計算を行う
- **メモリ** は計算中の値を一時的に置く
- **ストレージ** はデータを長く保存する

## プログラムとは

プログラムは CPU に渡す命令の列だ。人間が書いたソースコードを、機械が実行できる形に変換して動かす。

\`\`\`
ソースコード (.rs) → コンパイラ (rustc) → 実行ファイル → CPU が実行
\`\`\`

## なぜ Rust を使うのか

Rust は実行前に多くの誤りを見つける。エラーを早い段階で止められるので、学習でも原因を追いやすい。`,
      },
      {
        slug: "what-is-program",
        title: "プログラムとは何か",
        summary:
          "命令の列としてのプログラム、入力と出力、コンパイルの概念を押さえる。",
        estimatedMinutes: 10,
        content: `## 命令の列

プログラムは命令を上から順に実行する。

\`\`\`rust
fn main() {
    println!("1 行目");
    println!("2 行目");
    println!("3 行目");
}
\`\`\`

## 入力と出力

多くのプログラムは「入力を受けて処理し、出力を返す」という形で考えられる。

- **入力**: キーボード、ファイル、ネットワーク
- **処理**: 計算、変換、判定
- **出力**: 画面表示、ファイル書き込み

## コンパイルと実行

Rust のプログラムは、まずコンパイルし、そのあと実行する。コンパイル時にエラーが出たら、実行より先に修正が必要になる。`,
      },
      {
        slug: "values-and-variables",
        title: "値と変数",
        summary: "データを保持する変数の考え方と、Rust の `let` 宣言を学ぶ。",
        estimatedMinutes: 15,
        content: `## 値

プログラムが扱うデータを**値**と呼ぶ。

- 数値: \`42\`, \`3.14\`
- 文字列: \`"Hello"\`
- 真偽値: \`true\`, \`false\`

## 変数

値に名前をつけて保持するのが**変数**だ。Rust では \`let\` で変数を宣言する。

\`\`\`rust
let x = 42;
let name = "Rust";
let is_ready = true;
\`\`\`

## 不変と可変

Rust の変数はデフォルトで不変だ。値を変えたい場合は \`mut\` をつける。

\`\`\`rust
let mut count = 0;
count += 1;
\`\`\`

不変が基本になっていると、どこで値が変わるかを追いやすい。`,
      },
      {
        slug: "types-and-representation",
        title: "型",
        summary: "型が何を決めるのか、数値・文字列・真偽値の違いを確認する。",
        estimatedMinutes: 12,
        content: `## 型とは

型は「その値が何であり、どんな操作ができるか」を決める情報だ。

- 数値には足し算ができる
- 真偽値には真か偽かの判定がある
- 文字列は文字の並びとして扱う

## 型が違うと扱い方も変わる

\`\`\`rust
let age = 20;
let name = "Ren";
let is_student = true;
\`\`\`

\`age\` に文字列を入れたり、\`name\` に足し算をしたりはできない。型が違うからだ。

## 型エラーが助けになる

型がはっきりしていると、間違った操作を早く見つけられる。Rust はその確認をコンパイル時に行う。`,
      },
      {
        slug: "memory-basics",
        title: "メモリ",
        summary: "値がどこに置かれ、変数が何を指しているのかをイメージでつかむ。",
        estimatedMinutes: 12,
        content: `## メモリとは

メモリは、実行中の値を一時的に置く場所だ。変数は値そのものではなく、「どこに何があるか」を扱うための目印として考えると理解しやすい。

## 値の置き場所を意識する

\`\`\`rust
let x = 10;
let y = x;
\`\`\`

このような代入では、値がどのように扱われるかが言語ごとに決まっている。Rust ではこの振る舞いが所有権につながっていく。

## ここで押さえること

- 値はどこかの領域に置かれる
- 変数はその値を扱うための名前
- 実行中のメモリの使い方が、後で学ぶ所有権の土台になる`,
      },
      {
        slug: "condition-branches",
        title: "条件分岐",
        summary: "条件に応じて処理を変える `if` / `else` の基本を学ぶ。",
        estimatedMinutes: 15,
        content: `## 条件分岐とは

条件分岐は、状況によって処理を変える仕組みだ。入力値や判定結果に応じて、別の命令列を選ぶ。

\`\`\`rust
let score = 82;

if score >= 80 {
    println!("合格");
} else {
    println!("再挑戦");
}
\`\`\`

## 比較の結果は真偽値になる

\`score >= 80\` のような式は、結果として \`true\` か \`false\` を返す。この値をもとに分岐先が決まる。

## 注意点

- 条件は「真か偽か」で判定する
- 分岐が増えると読みづらくなる
- 先に条件の意味を言葉で整理すると書きやすい`,
      },
      {
        slug: "loops",
        title: "反復",
        summary: "同じ処理を繰り返す必要性と、`while` / `for` の考え方を押さえる。",
        estimatedMinutes: 15,
        content: `## 反復とは

同じ処理を何度も行いたいときは、命令を何行も並べるのではなく反復を使う。

\`\`\`rust
for n in 1..=5 {
    println!("{}", n);
}
\`\`\`

## いつ止まるかが重要

反復では「いつ終わるか」を必ず決める必要がある。終わる条件がないと、処理が止まらない。

\`\`\`rust
let mut count = 3;

while count > 0 {
    println!("{}", count);
    count -= 1;
}
\`\`\`

## 反復で見るべき点

- 何を繰り返すか
- 何を更新するか
- どの条件で止まるか`,
      },
      {
        slug: "functions-basics",
        title: "関数",
        summary: "処理を名前付きのまとまりに分ける理由と、引数・戻り値の基本を理解する。",
        estimatedMinutes: 15,
        content: `## 関数とは

関数は、ひとかたまりの処理に名前をつけたものだ。同じ処理を何度も書かずに済み、役割ごとにコードを分けられる。

\`\`\`rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}
\`\`\`

## 引数と戻り値

- **引数** は関数に渡す入力
- **戻り値** は関数が返す結果

\`\`\`rust
let total = add(3, 5);
println!("{}", total);
\`\`\`

## 関数に切り出す判断

処理の意味をひとことで言えるなら、関数に分ける価値がある。名前がつくと、コードの意図が読みやすくなる。`,
      },
      {
        slug: "arrays-and-strings",
        title: "配列・文字列",
        summary: "複数の値をまとめる配列と、文字の並びとしての文字列を区別して扱う。",
        estimatedMinutes: 18,
        content: `## 配列

配列は、同じ種類の値を順番つきで並べたものだ。

\`\`\`rust
let scores = [72, 84, 91];
println!("{}", scores[0]);
\`\`\`

## 文字列

文字列は文字の並びだ。文章や名前、入力されたテキストなどを扱うときに使う。

\`\`\`rust
let greeting = "Hello";
println!("{}", greeting);
\`\`\`

## 配列と文字列は別物

どちらも「並び」に見えるが、用途は違う。配列は同じ型の値の集まり、文字列はテキストを表す。

## 注意点

- 添字は 0 から始まる
- 配列の範囲外を読むと危険
- 文字列は見た目の文字数と内部表現が一致しないことがある`,
      },
      {
        slug: "debugging-basics",
        title: "デバッグ",
        summary: "エラーや想定外の出力に出会ったとき、どこから確認するかを整理する。",
        estimatedMinutes: 12,
        content: `## デバッグとは

デバッグは、プログラムの不具合の原因を見つけて直す作業だ。勘で直すのではなく、観察して切り分ける。

## まず分けて考える

不具合は大きく 3 種類に分けて考えられる。

- 書き方が間違っている
- 実行はできるが、結果が違う
- 特定の条件で途中で止まる

## 小さく確かめる

\`\`\`rust
println!("x = {}", x);
\`\`\`

途中の値を表示すると、どこで想定とずれたか見つけやすい。入力を小さくして再現するのも有効だ。

## 覚えておくこと

- 一度に多くを変えない
- 再現条件をメモする
- 出力を見て仮説を立てる`,
      },
      {
        slug: "intro-to-complexity",
        title: "計算量入門",
        summary: "入力が大きくなったとき、処理の重さがどう変わるかを直感でつかむ。",
        estimatedMinutes: 12,
        content: `## 計算量とは

計算量は、入力サイズが大きくなったときに処理時間や手数がどの程度増えるかを表す考え方だ。

## 例で見る

\`\`\`text
1 件ずつ調べる処理 → データが 2 倍なら手数もだいたい 2 倍
2 重ループの処理 → データが 2 倍なら手数はだいたい 4 倍
\`\`\`

## 何が問題になるのか

小さい入力では気にならない差でも、データ量が増えると処理時間に大きな差が出る。

## 今の段階で十分な理解

- 手数は入力サイズに応じて増える
- 反復が入れ子になると増え方が急になる
- 後で競技プログラミングや実務で重要になる`,
      },
      {
        slug: "input-and-output",
        title: "入出力",
        summary: "標準入力と標準出力の流れを理解し、値を読み取って表示する最小構成を確認する。",
        estimatedMinutes: 18,
        content: `## 入力を読む

Rust で標準入力を読むときは、まず文字列として受け取り、必要に応じて数値へ変換する。

\`\`\`rust
use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let n: i32 = input.trim().parse().unwrap();
    println!("{}", n * 2);
}
\`\`\`

## 出力する

画面に表示するときは \`println!\` を使う。最後に改行が入るので、結果を 1 行ずつ出したいときに向いている。

## つまずきやすい点

- 入力の末尾に改行が含まれる
- 数値に変換する前に \`trim()\` が必要なことが多い
- 入出力は練習量で慣れる部分が大きい`,
      },
    ],
  },
  {
    code: "track1",
    label: "Track 1",
    name: "Rust 入門",
    description:
      "Rust の基本文法から、所有権、借用、スライス、構造体、列挙型、match までを段階的に学ぶ。",
    gradient: "from-orange-600 to-red-600",
    availability: "available",
    roadmapTopics: [
      "Rust と Cargo",
      "let と mut",
      "基本型",
      "文字列と配列",
      "関数",
      "制御構文",
      "所有権",
      "参照と借用",
      "スライス",
      "構造体",
      "列挙型",
      "match",
      "Option",
      "Result",
      "Vec",
      "HashMap",
      "イテレータ",
      "クロージャ",
      "モジュール",
      "テスト",
      "fmt / clippy",
      "ドキュメント",
      "エラー読解",
      "総合演習",
    ],
    launchNote:
      "前半 12 レッスンを公開中です。Option / Result 以降の後半単元は次段階で追加します。",
    lessons: [
      {
        slug: "rust-and-cargo",
        title: "Rust と Cargo",
        summary: "Rust の開発環境と Cargo ビルドシステムの基本操作。",
        estimatedMinutes: 15,
        content: `## Rust のインストール

Rust は rustup を使ってインストールする。

\`\`\`bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
\`\`\`

インストール後、\`rustc --version\` でバージョンを確認できる。

## Cargo

Cargo は Rust の公式ビルドシステム兼パッケージマネージャだ。

\`\`\`bash
cargo new my_project
cd my_project
cargo build
cargo run
cargo test
\`\`\`

## 最初に覚えること

- プロジェクト作成は \`cargo new\`
- 実行は \`cargo run\`
- テストは \`cargo test\``,
      },
      {
        slug: "let-and-mut",
        title: "let と mut",
        summary: "変数宣言と不変性、可変変数、シャドーイングを区別して理解する。",
        estimatedMinutes: 15,
        content: `## let

Rust では \`let\` で変数を束縛する。

\`\`\`rust
let x = 5;
\`\`\`

## 不変性

\`let\` で宣言した変数はデフォルトで不変だ。

\`\`\`rust
let x = 5;
// x = 6; // エラー
\`\`\`

## mut とシャドーイング

\`\`\`rust
let mut count = 0;
count += 1;

let spaces = "   ";
let spaces = spaces.len();
\`\`\`

\`mut\` は同じ変数の値を変える。シャドーイングは同じ名前で新しい変数を作る。`,
      },
      {
        slug: "basic-types",
        title: "基本型",
        summary: "整数、浮動小数点、ブール、文字の基本型と型注釈を確認する。",
        estimatedMinutes: 15,
        content: `## スカラ型

Rust の基本型には整数、浮動小数点、真偽値、文字がある。

| 型 | 例 |
| --- | --- |
| 整数 | \`i32\`, \`u64\` |
| 浮動小数点 | \`f32\`, \`f64\` |
| 真偽値 | \`bool\` |
| 文字 | \`char\` |

## 型注釈

\`\`\`rust
let guess: u32 = "42".parse().expect("数値ではありません");
\`\`\`

型が推論できない場面では、型注釈が必要になる。

## 注意点

- 整数のデフォルトは \`i32\`
- 浮動小数点のデフォルトは \`f64\`
- \`char\` は 1 文字、\`String\` は文字列全体を表す`,
      },
      {
        slug: "strings-and-arrays",
        title: "文字列と配列",
        summary: "固定長配列と可変長文字列の違い、`String` と `&str` の役割を学ぶ。",
        estimatedMinutes: 18,
        content: `## 配列

配列は同じ型の値を固定長で並べる型だ。

\`\`\`rust
let numbers = [10, 20, 30];
println!("{}", numbers[1]);
\`\`\`

## 文字列

Rust では、文字列リテラルは \`&str\`、変更可能な文字列は \`String\` で扱う。

\`\`\`rust
let title = "Rust";
let mut name = String::from("Dojo");
name.push_str(" App");
\`\`\`

## 使い分け

- \`&str\`: 既にある文字列を借りて読む
- \`String\`: 所有して変更する

この違いは、後で学ぶ所有権と借用に直結する。`,
      },
      {
        slug: "functions",
        title: "関数",
        summary: "関数定義、引数、戻り値、式として値を返す書き方を練習する。",
        estimatedMinutes: 15,
        content: `## 関数を定義する

\`\`\`rust
fn double(n: i32) -> i32 {
    n * 2
}
\`\`\`

## 式で返す

Rust では、ブロックの最後の式にセミコロンをつけないと、その値が返り値になる。

\`\`\`rust
fn square(n: i32) -> i32 {
    n * n
}
\`\`\`

## 文と式の違い

- 文は処理を実行して終わる
- 式は値を返す

この区別に慣れると、Rust のコードが読みやすくなる。`,
      },
      {
        slug: "control-flow",
        title: "制御構文",
        summary: "`if`、`loop`、`while`、`for` を使い分けて処理の流れを制御する。",
        estimatedMinutes: 18,
        content: `## if は式でもある

\`\`\`rust
let number = 6;
let label = if number % 2 == 0 { "even" } else { "odd" };
\`\`\`

## 反復の種類

\`\`\`rust
for n in 1..=3 {
    println!("{}", n);
}
\`\`\`

\`\`\`rust
let mut count = 0;
while count < 3 {
    count += 1;
}
\`\`\`

## 使い分けの目安

- 回数や範囲が決まっているなら \`for\`
- 条件で止めるなら \`while\`
- 自分で抜ける条件を細かく書きたいなら \`loop\``,
      },
      {
        slug: "ownership",
        title: "所有権",
        summary: "Rust の中心概念である所有権を、`String` の move を通して理解する。",
        estimatedMinutes: 20,
        content: `## 所有権とは

Rust では、ある値をだれが管理しているかが明確に決まる。この「管理者」を所有者と呼ぶ。

## move が起きる例

\`\`\`rust
let s1 = String::from("hello");
let s2 = s1;
// println!("{}", s1); // ここでは使えない
\`\`\`

\`String\` のような値では、代入時に所有権が移動する。これを **move** と呼ぶ。

## なぜ必要か

所有者を 1 つに決めると、同じメモリを二重に解放する事故を防げる。Rust は安全性のためにこの制約を使っている。`,
      },
      {
        slug: "references-and-borrowing",
        title: "参照と借用",
        summary: "値を渡しつつ所有権を移さないための参照と、借用規則を学ぶ。",
        estimatedMinutes: 20,
        content: `## 参照を使う

所有権を渡したくないときは、値そのものではなく参照を渡す。

\`\`\`rust
fn len_of(s: &String) -> usize {
    s.len()
}
\`\`\`

## 可変参照

\`\`\`rust
fn append_world(s: &mut String) {
    s.push_str(" world");
}
\`\`\`

## 借用規則

- 同時に複数の可変参照は作れない
- 可変参照がある間は不変参照も使えない

この制約で、書き込み競合や参照先の破壊を防いでいる。`,
      },
      {
        slug: "slices",
        title: "スライス",
        summary: "配列や文字列の一部分を借りて扱うスライスを理解する。",
        estimatedMinutes: 18,
        content: `## スライスとは

スライスは、元のデータ全体ではなく一部分を借りて扱う型だ。

\`\`\`rust
let s = String::from("hello");
let h = &s[0..2];
println!("{}", h);
\`\`\`

## 文字列スライス

\`&str\` は文字列スライスだ。文字列リテラルも \`&str\` として扱われる。

## 役立つ場面

大きな文字列や配列から一部だけを読みたいとき、所有権を移さずに済む。

## 注意点

文字列は UTF-8 で表現されるので、途中のバイト位置で切るとエラーになることがある。`,
      },
      {
        slug: "structs",
        title: "構造体",
        summary: "関連する複数の値を 1 つにまとめる構造体と、フィールドアクセスの書き方を学ぶ。",
        estimatedMinutes: 18,
        content: `## 構造体とは

構造体は、意味のある複数のデータをまとめて 1 つの型として扱う仕組みだ。

\`\`\`rust
struct User {
    name: String,
    level: u32,
}
\`\`\`

## 使い方

\`\`\`rust
let user = User {
    name: String::from("ren"),
    level: 3,
};

println!("{}", user.level);
\`\`\`

## いつ使うか

別々の変数で持つより、ひとまとまりとして扱いたいときに使う。データの意味がはっきりする。`,
      },
      {
        slug: "enums",
        title: "列挙型",
        summary: "取りうる状態を列挙で表し、値の種類を型として制限する。",
        estimatedMinutes: 18,
        content: `## 列挙型とは

列挙型は「この値はこの候補のどれか」と表したいときに使う。

\`\`\`rust
enum Direction {
    Up,
    Down,
    Left,
    Right,
}
\`\`\`

## 状態を型で表せる

文字列で \`"up"\` や \`"down"\` と持つより、列挙型のほうが取りうる値を限定できる。

## Rust らしい使い方

\`Option\` や \`Result\` も列挙型だ。Rust では状態の分岐を列挙型で表すことが多い。`,
      },
      {
        slug: "match",
        title: "match",
        summary: "列挙型や条件分岐を漏れなく処理する `match` の書き方を学ぶ。",
        estimatedMinutes: 20,
        content: `## match とは

\`match\` は、値の種類ごとに分岐を書く構文だ。分岐が漏れているとコンパイルエラーになる。

\`\`\`rust
enum Direction {
    Up,
    Down,
}

fn label(dir: Direction) -> &'static str {
    match dir {
        Direction::Up => "up",
        Direction::Down => "down",
    }
}
\`\`\`

## if との違い

\`if\` は条件式を順に判定する。 \`match\` は値のパターンを漏れなく扱う場面に向いている。

## この先につながる点

列挙型と \`match\` を組み合わせると、状態ごとの処理を安全に書ける。Rust のコードで非常によく出てくる組み合わせだ。`,
      },
    ],
  },
  {
    code: "track2",
    label: "Track 2",
    name: "Rust 実務",
    description:
      "Cargo ワークスペース、crate 設計、テスト戦略、CLI ツール作成など、実務で使う開発フローを段階的に学ぶ。",
    gradient: "from-blue-600 to-indigo-600",
    availability: "coming_soon",
    roadmapTopics: [
      "Cargo project / workspace",
      "モジュール設計",
      "crate 設計",
      "公開 API 設計",
      "エラー設計",
      "thiserror / anyhow 導入",
      "serde",
      "CLI ツール作成",
      "ファイル I/O",
      "ログ",
      "テスト戦略",
      "リファクタリング",
      "ドキュメント",
      "コード品質",
      "小規模プロジェクト制作",
    ],
    launchNote:
      "Track 2 は現在準備中です。Rust 入門を終えた人向けに、実務で必要な設計と品質管理の流れをまとめて公開します。",
    lessons: [],
  },
  {
    code: "track3",
    label: "Track 3",
    name: "AtCoder Rust",
    description:
      "AtCoder の入出力、基本データ構造、探索の考え方を rustc 1.89.0 前提で学ぶ。",
    gradient: "from-purple-600 to-pink-600",
    availability: "available",
    roadmapTopics: [
      "AtCoder 用 Rust 環境の前提",
      "入出力テンプレート",
      "基本データ構造",
      "ソートと探索",
      "全探索",
      "二分探索",
      "累積和",
      "尺取り",
      "BFS / DFS",
      "グラフ",
      "DP",
      "Union-Find",
      "数論",
      "典型問題セット",
      "AtCoder 過去問セット",
    ],
    launchNote:
      "初期 5 レッスンを公開中です。二分探索以降の単元と典型問題セットは順次追加します。",
    lessons: [
      {
        slug: "atcoder-environment",
        title: "AtCoder 用 Rust 環境の前提",
        summary:
          "AtCoder の Rust 実行環境と、提出時に意識する前提条件を整理する。",
        estimatedMinutes: 15,
        content: `## まず前提をそろえる

AtCoder では、ローカル環境と提出先の前提がずれていると通るはずのコードで詰まりやすい。最初に見るべきなのは、**使える Rust の版** と **標準入力の形式** だ。

## Rust 版を意識する

Rust Dojo の競プロトラックでは、AtCoder の現行前提である **rustc 1.89.0** を基準に考える。ローカルで新しすぎる機能に頼ると、提出先で通らないことがある。

## 競プロでよく使う流れ

1. 入力をまとめて読む
2. 必要な型へ変換する
3. ループや探索で答えを作る
4. 余計な表示を入れずに答えだけを出力する

## 最初に覚えること

- 提出コードは 1 ファイルで完結することが多い
- 標準入力を確実に読める形を先に作る
- デバッグ出力を残したまま提出しない`,
      },
      {
        slug: "io-template",
        title: "入出力テンプレート",
        summary:
          "競プロで繰り返し使う標準入力テンプレートと、値の取り出し方を確認する。",
        estimatedMinutes: 18,
        content: `## なぜテンプレートを持つのか

AtCoder では、問題ごとに入力形式は変わっても「標準入力をまとめて読み、空白区切りで解釈する」という流れはよく似ている。毎回そこに迷わないために、最初に型を決めたテンプレートを持つ。

\`\`\`rust
use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let mut iter = input.split_whitespace();

    let n: usize = iter.next().unwrap().parse().unwrap();
    let m: i64 = iter.next().unwrap().parse().unwrap();

    println!("{} {}", n, m);
}
\`\`\`

## テンプレートの見方

- まず全文を読む
- \`split_whitespace()\` で空白区切りにする
- \`next()\` で順に取り出す
- \`parse()\` で必要な型へ変換する

## つまずきやすい点

- \`usize\` と \`i64\` を混ぜる場面がある
- 配列入力ではループで複数回読む
- 改行は空白として扱われるので、行ごとの差を意識しすぎなくてよい`,
      },
      {
        slug: "vec-and-basic-data-structures",
        title: "Vec と基本データ構造",
        summary:
          "競プロで頻出の `Vec` を中心に、配列入力の保持と走査の基本を固める。",
        estimatedMinutes: 18,
        content: `## Vec を使う理由

競プロでは、長さ N の数列や座標列をまとめて持つ場面が多い。要素数が入力で決まるときは、固定長配列より \`Vec\` が扱いやすい。

\`\`\`rust
let values: Vec<i64> = (0..n)
    .map(|_| iter.next().unwrap().parse().unwrap())
    .collect();
\`\`\`

## よく使う操作

- 要素数を調べる: \`values.len()\`
- 要素を順に見る: \`for &v in &values\`
- 合計を求める: \`values.iter().sum::<i64>()\`
- 最大値を取る: \`values.iter().max()\`

## 競プロでの見方

\`Vec\` は「あとで何度も走査する入力」を保持する器として使うことが多い。読みながら処理するか、一度保存してから処理するかを先に決めると書きやすい。`,
      },
      {
        slug: "sorting-and-searching",
        title: "ソートと探索",
        summary:
          "並べ替えと探索の基本を整理し、線形探索とソート済み配列の扱いを学ぶ。",
        estimatedMinutes: 18,
        content: `## ソートの役割

値を並べ替えると、大小関係が見やすくなる。中央値、重複、連続区間の判定など、多くの問題で前処理として使う。

\`\`\`rust
let mut values = vec![4, 1, 3, 2];
values.sort();
\`\`\`

## 線形探索

配列を先頭から順に調べる方法だ。長さが小さいときや、1 回しか調べないときは十分実用的だ。

\`\`\`rust
let mut found = -1;
for (i, &value) in values.iter().enumerate() {
    if value == target {
        found = i as i32;
        break;
    }
}
\`\`\`

## 次にどうつながるか

ソート済み配列が前提になると、次の段階で二分探索が使えるようになる。まずは「並べると何が楽になるか」を理解する。`,
      },
      {
        slug: "bruteforce-basics",
        title: "全探索の基本",
        summary:
          "候補を漏れなく調べる全探索の考え方と、ループの組み立て方を確認する。",
        estimatedMinutes: 18,
        content: `## 全探索とは

答えの候補がそこまで多くないときは、条件を満たすかを全部調べる方法が有効だ。これを全探索と呼ぶ。

\`\`\`rust
for i in 0..n {
    for j in i + 1..n {
        // 2 つ選んだときの条件を調べる
    }
}
\`\`\`

## 強み

- 実装が素直
- 条件の漏れを減らしやすい
- 小さい制約では最短で正解に届く

## 注意点

全探索は候補数が増えると急に重くなる。制約を見て「何重ループまで許されるか」を考える癖をつけることが大事だ。

## 競プロでの判断

最初から難しい解法を探すより、まずは全探索で通るかを確かめる。制約が小さければ、それがそのまま正解になる。`,
      },
    ],
  },
];

export function getTrack(code: string): TrackData | undefined {
  return tracks.find((t) => t.code === code);
}

export function getTrackDisplayName(track: TrackData): string {
  return `${track.label} — ${track.name}`;
}

export function getTrackVolumeLabel(track: TrackData): string {
  if (track.availability === "coming_soon") {
    return `予定 ${track.roadmapTopics.length} テーマ`;
  }

  if (track.lessons.length === track.roadmapTopics.length) {
    return `全 ${track.lessons.length} 回`;
  }

  return `公開 ${track.lessons.length} / ${track.roadmapTopics.length} テーマ`;
}

export function getLesson(
  trackCode: string,
  lessonSlug: string
): LessonData | undefined {
  const track = getTrack(trackCode);
  if (!track) return undefined;
  return track.lessons.find((lesson) => lesson.slug === lessonSlug);
}
