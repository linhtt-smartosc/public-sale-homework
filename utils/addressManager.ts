import fs from 'fs'
import path from 'path'
export enum Task {
  deploy_factory,
  deploy_whole,
  deploy_base_token,
}
export const writeAddresses = async (
  task: Task,
  chainId: number,
  addresses: any
): Promise<void> => {
  console.log("acb")

  const prevAddresses = await getAddresses(task, chainId)
  const newAddresses = {
    ...prevAddresses,
    ...addresses
  }
  return new Promise((resolve, _reject) => {
    fs.writeFile(
      getFilePath(task, getNetworkName(chainId)),
      JSON.stringify(newAddresses),
      () => {
        resolve()
      }
    )
  })
}

const getFilePath = (task: Task, networkName: string): string => {
  let taskStr;
  if (task == 0) {
    taskStr = "factory"
  } else if (task == 1) {
    taskStr = "basetoken"
  } else if (task == 2) {
    taskStr = "whole"
  }
  return path.join(__dirname, `../addresses-${taskStr}-${networkName}.json`)
}

const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return 'ethereum'
    case 11155111:
      return 'sepolia'
    case 1337:
      return 'localhost'
  }
  return ''
}

export const getAddresses = async (task: Task, chainId: number): Promise<any> => {
    const networkName = getNetworkName(chainId)
    return new Promise((resolve, reject) => {
      fs.readFile(getFilePath(task, networkName), {flag: "r"}, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(JSON.parse(data.toString()))
        }
      })
    })
  }
