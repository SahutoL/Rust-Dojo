// 学習コンテンツのデータ定義
// MVP 段階ではハードコード。将来的に DB + CMS に移行する。
import type { LessonData, TrackData } from "./lesson-authoring";
import { track0Lessons } from "./track0-lessons";

export type {
  LessonData,
  LessonExplanationSectionData,
  LessonQuizData,
  LessonSandboxData,
  LessonSummarySectionData,
  TrackData,
} from "./lesson-authoring";

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
    lessons: track0Lessons,
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
