import '@fontsource-variable/jetbrains-mono';
import '@fontsource/fusion-pixel-12px-monospaced-sc';
import './styles-base.css';
import './styles-default.css';
// public 下的项目主题，用相对路径纳入打包顺序，避免运行时 <link> 异步加载造成闪烁
import '../public/nav-hoard.custom.css';
import './nav-hoard.ts';
