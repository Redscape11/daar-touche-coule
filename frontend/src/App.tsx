import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './styles.module.css'
import * as ethereum from '@/lib/ethereum'
import * as main from '@/lib/main'
import { BigNumber } from 'ethers'

type Canceler = () => void
const useAffect = (
  asyncEffect: () => Promise<Canceler | void>,
  dependencies: any[] = []
) => {
  const cancelerRef = useRef<Canceler | void>()
  useEffect(() => {
    asyncEffect()
      .then(canceler => (cancelerRef.current = canceler))
      .catch(error => console.warn('Uncatched error', error))
    return () => {
      if (cancelerRef.current) {
        cancelerRef.current()
        cancelerRef.current = undefined
      }
    }
  }, dependencies)
}

const useWindowSize = () => {
  const [size, setSize] = useState({ height: 0, width: 0 })
  const compute = useCallback(() => {
    const height = Math.min(window.innerHeight, 800)
    const width = Math.min(window.innerWidth, 800)
    if (height < width) setSize({ height, width: height })
    else setSize({ height: width, width })
  }, [])
  useEffect(() => {
    compute()
    window.addEventListener('resize', compute)
    return () => window.addEventListener('resize', compute)
  }, [compute])
  return size
}

const useWallet = () => {
  const [details, setDetails] = useState<ethereum.Details>()
  const [contract, setContract] = useState<main.Main>()
  useAffect(async () => {
    const details_ = await ethereum.connect('metamask')
    if (!details_) return
    setDetails(details_)
    const contract_ = await main.init(details_)
    if (!contract_) return
    setContract(contract_)
  }, [])
  return useMemo(() => {
    if (!details || !contract) return
    return { details, contract }
  }, [details, contract])
}

type Ship = { owner: string, index: number }
const useBoard = (wallet: ReturnType<typeof useWallet>) => {
  const [board, setBoard] = useState<(null | Ship)[][]>([])
  useAffect(async () => {
    if (!wallet) return
    const onRegistered = (
      id: BigNumber,
      owner: string,
      x: BigNumber,
      y: BigNumber
    ) => {
      console.log('onRegistered')
      setBoard(board => {
        return board.map((x_, index) => {
          if (index !== x.toNumber()) return x_
          return x_.map((y_, indey) => {
            if (indey !== y.toNumber()) return y_
            return { owner, index: id.toNumber() }
          })
        })
      })
    }
    const onTouched = (id: BigNumber, x_: BigNumber, y_: BigNumber) => {
      console.log('onTouched')
      const x = x_.toNumber()
      const y = y_.toNumber()
      setBoard(board => {
        return board.map((x_, index) => {
          if (index !== x) return x_
          return x_.map((y_, indey) => {
            if (indey !== y) return y_
            return null
          })
        })
      })
    }
    const updateSize = async () => {
      const [event] = await wallet.contract.queryFilter('Size', 0)
      const width = event.args.width.toNumber()
      const height = event.args.height.toNumber()
      const content = new Array(width).fill(0)
      const final = content.map(() => new Array(height).fill(null))
      setBoard(final)
    }
    const updateRegistered = async () => {
      const registeredEvent = await wallet.contract.queryFilter('Registered', 0)
      registeredEvent.forEach(event => {
        const { index, owner, x, y } = event.args
        onRegistered(index, owner, x, y)
      })
    }
    const updateTouched = async () => {
      const touchedEvent = await wallet.contract.queryFilter('Touched', 0)
      touchedEvent.forEach(event => {
        const { ship, x, y } = event.args
        onTouched(ship, x, y)
      })
    }
    await updateSize()
    await updateRegistered()
    await updateTouched()
    console.log('Registering')
    wallet.contract.on('Registered', onRegistered)
    wallet.contract.on('Touched', onTouched)
    return () => {
      console.log('Unregistering')
      wallet.contract.off('Registered', onRegistered)
      wallet.contract.off('Touched', onTouched)
    }
  }, [wallet])
  return board
}

const randomNum = () => {
  let min = Math.ceil(0);
  let max = Math.floor(2500);
  return Math.floor(Math.random() * (max - min) + min);
}

const CELLS = new Array(100 * 100)
export const App = () => {
  const wallet = useWallet()
  const board = useBoard(wallet)
  const size = useWindowSize()
  const [player, setPlayer] = useState<Number | null>(null);
  const [isFirst, setIsFirst] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isFire, setIsFire] = useState(false);

  const st = {
    ...size,
    gridTemplateRows: `repeat(${board?.length ?? 0}, 1fr)`,
    gridTemplateColumns: `repeat(${board?.[0]?.length ?? 0}, 1fr)`,
  }
  const register = () => {
    window.alert('Click on the cell you want to put your ship on');
    setIsRegistering(true);
  };
  const next = () => {
    let firePos = []
    let notnull = 0;
    board.forEach(function (value) {
      value.forEach(function (val) {
        if (val != null) notnull += 1
      })
    })
    for (let i = 0; i < notnull; i++) {
      let pos = randomNum()
      firePos.push(pos)
    }
    console.log(firePos)
    wallet?.contract.turn(firePos);
  }

  const handleClick = (index: number) => () => {
    console.log(index);
    if (isRegistering) {
      let boat = null;
      if (player === 1) {
        boat = isFirst ? main.p1Cruiser() : main.p1Destroyer();
      } else {
        boat = isFirst ? main.p2Cruiser() : main.p2Destroyer();
      }
      wallet?.contract.register(boat, index);
      setIsFirst(false);
      setIsRegistering(false);
    }
  }
  return (
    <div className={styles.body}>
      <h1>Welcome to Touché Coulé</h1>
      <div className={styles.grid} style={st}>
        {CELLS.fill(0).map((_, index) => {
          const x = Math.floor(index % board?.length ?? 0)
          const y = Math.floor(index / board?.[0]?.length ?? 0)
          if (board?.[x]?.[y]) console.log(board?.[x]?.[y], wallet?.details.account)
          const background = board?.[x]?.[y] ? (board?.[x]?.[y]?.owner === wallet?.details.account ? 'green' : 'red') : undefined
          return (
            <div key={index} className={styles.cell} style={{ background }} onClick={handleClick(index)} />
          )
        })}
      </div>
      {
        player !== null ?
          <div style={{ display: 'flex', gap: 5, padding: 5 }}>
            <button onClick={register}>Register</button>
            <button onClick={next}>Turn</button>
          </div> :
          <div style={{ display: 'flex', gap: 5, padding: 5 }}>
            <div>Select player:</div>
            <button onClick={() => setPlayer(1)}>Player 1</button>
            <button onClick={() => setPlayer(2)}>Player 2</button>
          </div>
      }
    </div>
  )
}
