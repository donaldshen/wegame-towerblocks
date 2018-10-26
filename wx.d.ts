declare namespace wx {
  function showToast (config: {
    icon?: 'success' | 'loading' | 'none'
    title: string
  }): void
}

declare interface OpenDataContext {
  canvas: HTMLCanvasElement
  postMessage (msg: {
    method: string
    [prop: string]: any
  }): void
}

declare interface UserInfoButton {
  destroy (): void
}

declare interface GameClubButton {
  show (): void
  hide (): void
}
