declare module 'video.js' {
  import Player from 'video.js/dist/types/player'
  export default function videojs(
    element: Element | string,
    options?: any,
    ready?: () => void
  ): Player
  export { Player }
}
