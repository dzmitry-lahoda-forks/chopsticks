import { spawn } from 'node:child_process'

import { defaultLogger } from './logger'
import { runTask } from './executor'

const logger = defaultLogger.child({ name: 'task' })

export interface TaskResponseCall {
  Call: {
    result: string
    storageDiff: [string, string | null][]
  }
}

export interface TaskResponseError {
  Error: string
}

export type TaskResponse = TaskResponseCall | TaskResponseError

interface TaskCall {
  wasm: string
  blockHash: string
  calls: [string, string][]
  mockSignatureHost?: boolean
  allowUnresolvedImports?: boolean
}

interface TaskCalculateStateRoot {
  entries: [string, string][]
}

type Task = { Call: TaskCall } | { CalculateStateRoot: TaskCalculateStateRoot }

export class TaskManager {
  #tasks: { task: Task; callback: (res: TaskResponse) => any }[] = []
  #listeningPort: number
  #mockSignatureHost: boolean
  #executorCmd?: string
  #allowUnresolvedImports: boolean

  constructor(listeningPort: number, mockSignatureHost = false, executorCmd?: string, allowUnresolvedImports = false) {
    this.#listeningPort = listeningPort
    this.#mockSignatureHost = mockSignatureHost
    this.#executorCmd = executorCmd
    this.#allowUnresolvedImports = allowUnresolvedImports

    if (this.#mockSignatureHost) {
      logger.info('Mock signature host enabled')
    }

    if (this.#allowUnresolvedImports) {
      logger.info('Allow unresolved imports enabled. Wasm may expect more host functions, but will not fail on load')
    }
  }

  updateListeningPort(port: number) {
    this.#listeningPort = port
  }

  addTask(task: Task, callback: (res: TaskResponse) => any = () => {}) {
    logger.debug(
      {
        kind: Object.keys(task)[0],
      },
      'AddTask'
    )

    if ('Call' in task && task.Call.mockSignatureHost === undefined) {
      task.Call.mockSignatureHost = this.#mockSignatureHost
    }
    if ('Call' in task && task.Call.allowUnresolvedImports === undefined) {
      task.Call.allowUnresolvedImports = this.#allowUnresolvedImports
    }

    this.#tasks.push({ task, callback })
    return this.#tasks.length - 1
  }

  getTask(taskId: number) {
    return this.#tasks[taskId]
  }

  runTask(taskId: number): Promise<void> {
    if (this.#executorCmd) {
      const cmd = `${this.#executorCmd} --runner-url=ws://localhost:${this.#listeningPort} --task-id=${taskId}`
      logger.info({ taskId, cmd }, 'RunTask')
      const p = spawn(cmd, { shell: true, stdio: 'inherit' })

      return new Promise((resolve) => {
        p.once('exit', (code) => {
          logger.debug({ taskId, code }, 'RunTask done')
          resolve()
        })
      })
    } else {
      return runTask(taskId, `ws://localhost:${this.#listeningPort}`)
    }
  }

  async addAndRunTask(task: Task, callback: (res: TaskResponse) => any = () => {}) {
    const taskId = this.addTask(task, callback)
    await this.runTask(taskId)
  }
}
