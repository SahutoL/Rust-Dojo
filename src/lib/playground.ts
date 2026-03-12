// Rust Playground API client
// https://play.rust-lang.org を利用してRustコードをコンパイル・実行する

interface PlaygroundRequest {
  channel: "stable" | "beta" | "nightly";
  mode: "debug" | "release";
  edition: "2021" | "2024";
  crateType: "bin";
  tests: boolean;
  code: string;
  backtrace: boolean;
}

interface PlaygroundResponse {
  success: boolean;
  exitDetail: string;
  stdout: string;
  stderr: string;
}

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  isCompileError: boolean;
  isTimeout: boolean;
}

const PLAYGROUND_URL = "https://play.rust-lang.org/execute";
const TIMEOUT_MS = 15000;

export async function executeRustCode(code: string): Promise<ExecutionResult> {
  const payload: PlaygroundRequest = {
    channel: "stable",
    mode: "debug",
    edition: "2021",
    crateType: "bin",
    tests: false,
    code,
    backtrace: false,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(PLAYGROUND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        stdout: "",
        stderr: `Playground API error: ${response.status}`,
        isCompileError: false,
        isTimeout: false,
      };
    }

    const data: PlaygroundResponse = await response.json();

    // コンパイルエラーの判定: stderr に "error[E" が含まれる場合
    const isCompileError =
      !data.success && data.stderr.includes("error[E");

    return {
      success: data.success,
      stdout: data.stdout,
      stderr: data.stderr,
      isCompileError,
      isTimeout: false,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        stdout: "",
        stderr: "実行がタイムアウトしました（15秒超過）。",
        isCompileError: false,
        isTimeout: true,
      };
    }
    return {
      success: false,
      stdout: "",
      stderr: "実行中にエラーが発生しました。",
      isCompileError: false,
      isTimeout: false,
    };
  }
}

/**
 * 標準入力を注入するためのラッパー。
 * Rust Playground は stdin を直接サポートしないため、
 * コード内の stdin 読み取りを文字列リテラルに置換する。
 */
export function injectStdin(code: string, stdin: string): string {
  // stdin が空の場合はそのまま返す
  if (!stdin) return code;

  // std::io::stdin().read_line() パターンをモックに置き換える
  const stdinLines = stdin.split("\n").filter((line) => line.length > 0);

  // read_line の呼び出しを文字列リテラルに置換するヘルパーを先頭に挿入
  const mockModule = `
// -- stdin mock (auto-injected) --
mod stdin_mock {
    use std::sync::Mutex;
    static LINES: Mutex<Option<Vec<String>>> = Mutex::new(None);

    pub fn init(input: &str) {
        let lines: Vec<String> = input.lines().map(|s| s.to_string()).collect();
        *LINES.lock().unwrap() = Some(lines);
    }

    pub fn read_line(buf: &mut String) -> std::io::Result<usize> {
        let mut guard = LINES.lock().unwrap();
        if let Some(ref mut lines) = *guard {
            if !lines.is_empty() {
                let line = lines.remove(0);
                let len = line.len();
                buf.push_str(&line);
                buf.push('\\n');
                return Ok(len + 1);
            }
        }
        Ok(0)
    }
}
// -- end stdin mock --
`;

  const escapedStdin = stdin.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  // use std::io; を残しつつ、main 関数の先頭に初期化コードを追加
  // io::stdin().read_line(&mut ...) を stdin_mock::read_line(&mut ...) に置換
  let modified = code;

  // stdin().read_line パターンを置換
  modified = modified.replace(
    /io::stdin\(\)\.read_line\(/g,
    "stdin_mock::read_line("
  );
  modified = modified.replace(
    /std::io::stdin\(\)\.read_line\(/g,
    "stdin_mock::read_line("
  );

  // main 関数の先頭に初期化を挿入
  modified = modified.replace(
    /fn main\(\)\s*\{/,
    `fn main() {\n    stdin_mock::init("${escapedStdin}");`
  );

  return mockModule + "\n" + modified;
}
