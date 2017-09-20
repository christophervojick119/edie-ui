import React from 'react'
import { Modal, CardPanel } from 'components/modal/parts'

export default class DeviceFixModalView extends React.Component {
  render () {
    const {onHide, msg} = this.props
    return (
      <Modal title="Fix" onRequestClose={onHide}>
        <CardPanel>
          {msg}
        </CardPanel>
      </Modal>
    )
  }
}
