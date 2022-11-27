import 'dotenv/config'
import { DeployFunction } from 'hardhat-deploy/types'

const deployer: DeployFunction = async hre => {
  if (hre.network.config.chainId !== 31337) return
  const { deployer } = await hre.getNamedAccounts()
  await hre.deployments.deploy('Main', { from: deployer, log: true })
  await hre.deployments.deploy('P1_Destroyer', { from: deployer, log: true })
  await hre.deployments.deploy('P1_Cruiser', { from: deployer, log: true })
  await hre.deployments.deploy('P2_Destroyer', { from: deployer, log: true })
  await hre.deployments.deploy('P2_Cruiser', { from: deployer, log: true })
}

export default deployer
