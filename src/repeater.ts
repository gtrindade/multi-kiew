export interface Repeatable {
  name: string
  func: () => Promise<string>
  success: (result: any) => void
  failure: (result: any) => void
  interval: number
  chatId: number
  kind: string
  currentValue?: any
  intervalFunc?: any
}

export class Repeaters {
  repeaters: Array<Repeatable>

  constructor() {
    this.repeaters = new Array<Repeatable>()
  }

  init(repeater: Repeatable) {
    clearInterval(repeater.intervalFunc)
    repeater.intervalFunc = setInterval(async () => {
      const result = await repeater.func()
      if (result !== repeater.currentValue) {
        repeater.currentValue = result
        await repeater.success(result)
      } else {
        await repeater.failure(result)
      }
    }, repeater.interval * 1000 * 60)
  }

  initAll() {
    this.repeaters.map(this.init)
  }

  add = async (repeatable: Repeatable) => {
    repeatable.currentValue = await repeatable.func()
    this.repeaters.push(repeatable)
    this.init(repeatable)
    return repeatable.currentValue
  }

  remove(name: string) {
    this.repeaters = this.repeaters.filter((repeater) => {
      if (repeater.name !== name) {
        return true
      }
      clearInterval(repeater.intervalFunc)
      return false
    })
  }

  getByName(value: string) {
    return this.repeaters.filter((repeater: Repeatable) => repeater.name === value)
  }

  getByKind(value: string) {
    return this.repeaters.filter((repeater: Repeatable) => repeater.kind === value)
  }
}
