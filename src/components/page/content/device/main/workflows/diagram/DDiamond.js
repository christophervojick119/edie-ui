import React from 'react'
import BaseObject from './BaseObject'

class DDiamond extends BaseObject {
  render () {
    const { x, y, w, h, listeners } = this.props

    return (
      <g style={{visibility: 'visible', cursor: 'move'}}>
        <path d={`M ${x + w / 2} ${y} L ${x} ${y + h / 2} L ${x + w / 2} ${y + h} L ${x + w} ${y + h / 2} Z`} stroke="#000000"
          fill="#ffffff" strokeMiterlimit="10" pointerEvents="all" {...listeners}/>
      </g>
    )
  }
}

export default DDiamond
