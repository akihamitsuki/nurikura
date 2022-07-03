// プロジェクト名
// TODO: 自分のプロジェクト名に変更する
const projectName = 'my_project';

// TypeScriptの変換設定
const tsSettings = {
  module: 'es2020',
  moduleResolution: 'node',
  lib: ['es2020', 'dom'],
  strict: true,
  target: 'es2020',
  noImplicitAny: true,
  removeComments: true,
};

// パッケージの読み込み
// gulp: タスクランナー
const gulp = require('gulp');
// TypeScript
const ts = require('gulp-typescript');
// ファイルの削除
const del = require('del');
// OS上の操作。フォルダ関係の操作に使う
const os = require('os');

// マインクラフトがインストールされている場所
const mcdir =
  os.homedir() +
  '/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/';

// ビルドされたファイルの削除
function clean_build(callbackFunction) {
  del(['build/behavior_pack/', 'build/resource_pack/']).then(
    // success
    (value) => {
      callbackFunction();
    },
    // error
    (reason) => {
      callbackFunction();
    }
  );
}

// ファイルを対象フォルダへ複製
function copy_behavior_pack() {
  return gulp.src(['behavior_pack/**/*']).pipe(gulp.dest('build/behavior_pack'));
}
// ファイルを対象フォルダへ複製
function copy_resource_pack() {
  return gulp.src(['resource_pack/**/*']).pipe(gulp.dest('build/resource_pack'));
}
// 上の二つを並行して実行
const copy_content = gulp.parallel(copy_behavior_pack, copy_resource_pack);

// TypeScriptをJavaScriptにコンパイル
function compile_scripts() {
  return (
    gulp
      // 対象ファイル
      .src('scripts/**/*.ts')
      // TypeScriptをコンパイル
      .pipe(ts(tsSettings))
      // 変換したファイルを対象フォルダに作成
      .pipe(gulp.dest('build/behavior_pack/scripts'))
  );
}

// ビルド: 次の関数を順に実行する
const build = gulp.series(clean_build, copy_content, compile_scripts);

// デプロイ先のファイルを削除する
function clean_localmc(callbackFunction) {
  if (!projectName || !projectName.length || projectName.length < 2) {
    console.log('No projectName specified.');
    callbackFunction();
    return;
  }
  // 対象フォルダのパスを取得
  const delFolders = [
    mcdir + 'development_behavior_packs/' + projectName,
    mcdir + 'development_resource_packs/' + projectName,
  ];
  // 削除する
  del(delFolders, {
    force: true,
  }).then(
    // Success
    (value) => {
      callbackFunction();
    },
    // Error
    (reason) => {
      callbackFunction();
    }
  );
}

// ビルドされたファイルをデプロイ先へコピー
function deploy_localmc_behavior_pack() {
  return gulp
    .src(['build/behavior_pack/**/*'])
    .pipe(gulp.dest(mcdir + 'development_behavior_packs/' + projectName));
}
function deploy_localmc_resource_pack() {
  return gulp
    .src(['build/resource_pack/**/*'])
    .pipe(gulp.dest(mcdir + 'development_resource_packs/' + projectName));
}

// デプロイ
const deploy_localmc = gulp.series(
  // デプロイ先のファイルを削除
  clean_localmc,
  // デプロイを実行
  gulp.parallel(deploy_localmc_behavior_pack, deploy_localmc_resource_pack)
);

// 対象ファイルを監視する
function watch() {
  return gulp.watch(
    // これらのファイルが変更されたら
    ['scripts/**/*.ts', 'behavior_pack/**/*', 'resource_pack/**/*'],
    // これを自動で実行する
    gulp.series(build, deploy_localmc)
  );
}

// 引数を付けずにgulpを実行した場合の初期値
exports.default = gulp.series(build, deploy_localmc);
// ビルド（だけをする）
exports.build = gulp.series(build);
// ビルド・デプロイしたファイルを削除
exports.clean = gulp.series(clean_build, clean_localmc);
// ファイルの変更を監視する
exports.watch = gulp.series(build, deploy_localmc, watch);
