import React from 'react'
import {concat} from 'lodash'
import {IconButton} from 'material-ui'
import AddCircleIcon from 'material-ui/svg-icons/content/add-circle'
import InfoIcon from 'material-ui/svg-icons/action/info'
import {debounce, findIndex} from 'lodash'

import WfRectModal from './workflow/WfRectModal'
import RectItem from './workflow/RectItem'

import {guid} from 'shared/Global'
import {showAlert} from "../../common/Alert";

export default class WorkflowDashboardView extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
    this.rectState = {}
  }
  componentWillMount () {
    this.debUpdateBoard = debounce(this.updateBoard.bind(this), 2000)
  }

  componentDidMount () {
    const {mxUtils, mxEditor, mxEvent} = window
    const node = mxUtils.load('/resources/plugins/mxgraph/config/workfloweditor.xml').getDocumentElement();
    const editor = new mxEditor(node);
    const graph = editor.graph

    this.editor = editor

    graph.minFitScale = 1
    graph.maxFitScale = 1
    graph.setCellsResizable(false)
    // graph.maximumGraphBounds = new window.mxRectangle(0, 0, 1024, 768)
    // const graph = new window.mxGraph(document.getElementById('graphContainer'))
    editor.setMode('connect')
    //editor.defaultEdge.style = 'straightEdge'

    // Enables rubberband selection
    new window.mxRubberband(graph)

    //Register styles
    this.registerGraphStyles(graph)

    // Adds cells to the model in a single step
    this.addGraphRects(this.getRects())

    // graph.zoomActual()
    graph.fit()
    graph.view.rendering = true
    graph.refresh()

    /////////////////////////

    graph.addListener(mxEvent.CELLS_MOVED, (sender, evt) => {
      evt.properties.cells.forEach(v => {
        if (!v.userData) return
        const {id} = v.userData
        // console.log(v)

        const rect = this.findRect(id)
        if (!rect) return

        rect.map = rect.map || {}
        rect.map.x = v.geometry.x
        rect.map.y = v.geometry.y

        console.log(rect)

        this.props.updateGaugeRect(rect, this.props.board, true)
        this.debUpdateBoard()
      })
    })

    /////////////////////////

    graph.addListener(mxEvent.CELL_CONNECTED, (sender, evt) => {
      const {edge, source} = evt.properties
      if (source || !edge.source || !edge.target) return
      const sourceId = edge.source.userData.id
      const destId = edge.target.userData.id

      const sourceRect = this.findRect(sourceId)
      if (!sourceRect) {
        console.log(`Rect not found: ${sourceId}`)
        return
      }
      sourceRect.map = sourceRect.map || {}
      sourceRect.map.lines = sourceRect.map.lines || []
      const existing = findIndex(sourceRect.map.lines, {id: destId})
      if (existing >= 0) {
        console.log('Already connected')
        return
      }

      sourceRect.map.lines.push({
        id: destId
      })

      console.log(sourceRect)
      this.props.updateGaugeRect(sourceRect, this.props.board, true)
      this.debUpdateBoard()
    })

    ///////////////////////////

    graph.addListener(mxEvent.CLICK, (sender, evt) => {
      // const e = evt.getProperty('event'); // mouse event
      const cell = evt.getProperty('cell'); // cell may be null

      if (cell != null ) {
        if (cell.userData) {
          evt.consume();
          const rect = this.findRect(cell.userData.id)
          this.onClickShowSearch(rect)
        }
      }
    })

  }

  componentDidUpdate (prevProps) {
    const prevRects = prevProps.board.rects || []
    const rects = this.getRects()
    const check = this.needUpdateRects(prevRects, rects)
    if (check.result) {
      console.log(`Change detected. Added: ${check.added.length} Updated: ${check.updated.length} Removed: ${check.removed.length}`)
      this.addGraphRects(check.added)
      this.updateGraphRects(check.updated)
    }
  }

  registerGraphStyles (graph) {
    const {mxConstants} = window
    let style = {}
    style[mxConstants.STYLE_SHAPE] = 'wfRect'
    style[mxConstants.STYLE_FONTCOLOR] = '#ffffff'
    style[mxConstants.STYLE_FONTSIZE] = '15'
    style[mxConstants.STYLE_FONTSTYLE] = mxConstants.FONT_BOLD
    style[mxConstants.STYLE_ROUNDED] = 1
    style[mxConstants.STYLE_ARCSIZE] = 6
    style[mxConstants.STYLE_STROKECOLOR] = '#D1282C'
    style[mxConstants.STYLE_FILLCOLOR] = '#D1282C'

    graph.getStylesheet().putCellStyle('box-red', style)

    style = {
      ...style,
      [mxConstants.STYLE_STROKECOLOR]: '#3cba54',
      [mxConstants.STYLE_FILLCOLOR]: '#3cba54'
    }

    graph.getStylesheet().putCellStyle('box-green', style)

    style = {
      ...style,
      [mxConstants.STYLE_STROKECOLOR]: 'gray',
      [mxConstants.STYLE_FILLCOLOR]: 'gray'
    }

    graph.getStylesheet().putCellStyle('box-gray', style)
  }

  needUpdateRects(prevRects, rects) {
    const added = []
    const updated = []
    const removed = prevRects.filter(p => rects.filter(n => n.id === p.id) === 0)

    rects.forEach(n => {
      const found = prevRects.filter(p => p.id === n.id)
      if (found.length) {
        const p = found[0]
        if (this.isRectDifferent(n, p)) {
          updated.push(n)
        }
      } else {
        added.push(n)
      }
    })

    return {
      result: (added.length + updated.length + removed.length) > 0,
      added, updated, removed
    }
  }

  isRectDifferent (n, p) {
    if (n.name !== p.name) return true
    return false
  }
  ///////////////////////////////////////////

  addGraphRects (items) {
    const {graph} = this.editor
    const parent = graph.getDefaultParent()

    graph.getModel().beginUpdate()

    try {
      const vertices = []
      items.forEach(p => {
        const map = p.map || {}

        const v = graph.insertVertex(parent, null,
          p.name, map.x || 10, map.y || 10, 135, 135, 'box-gray')
        v.userData = {
          id: p.id
        }

        vertices.push(v)
      })

      items.forEach((p, i) => {
        const map = p.map || {}
        if (!map.lines) return
        map.lines.forEach(t => {
          const targetIndex = findIndex(items, {id: t.id})
          if (targetIndex < 0) return

          const target = vertices[targetIndex]
          const source = vertices[i]

          graph.insertEdge(parent, null, '', source, target)
        })
      })
    }
    finally {
      // Updates the display
      graph.getModel().endUpdate()
    }
  }

  updateGraphRects (rects) {
    const {graph} = this.editor
    graph.getModel().beginUpdate()

    try {
      const cells = this.getAllGraphCells()
      rects.forEach(p => {
        const cell = this.findGraphCell(p.id, cells)
        if (!cell) return

        graph.getModel().setValue(cell, p.name)
      })
    }
    finally {
      // Updates the display
      graph.getModel().endUpdate()
    }

  }

  getSelectedRect () {
    const {graph} = this.editor
    const cell = graph.getSelectionCell()
    if (!cell || !cell.userData) return null
    return this.findRect(cell.userData.id)
  }

  getAllGraphCells () {
    const {graph} = this.editor
    const cells = graph.getChildVertices(graph.getDefaultParent())
    return cells
  }

  findGraphCell (rectId, allCells) {
    const cells = allCells || this.getAllGraphCells()
    const index = findIndex(cells, {
      userData: {id: rectId}
    })
    if (index < 0) return null
    return cells[index]
  }

  onUpdateRectState (id, good, bad) {
    if (!bad && !good) return

    const {graph} = this.editor
    const cell = this.findGraphCell(id)
    if (!cell) return

    graph.getModel().setStyle(cell, bad ? 'box-red' : 'box-green')
  }

  ///////////////////////////////////////////
  updateBoard () {
    this.props.updateGaugeBoard(this.props.board)
  }

  getUserSearchOptions () {
    const {userInfo} = this.props
    if (!userInfo) return []
    const {searchOptions} = userInfo
    if (!searchOptions) return []
    try {
      return JSON.parse(searchOptions)
    } catch (e) {
      console.log(e)
    }
    return []
  }

  getSearchList () {
    const {sysSearchOptions} = this.props
    return concat([], this.getUserSearchOptions().map(p => {
      return {
        ...p,
        type: 'User'
      }
    }), sysSearchOptions.map(p => {
      return {
        ...p,
        type: 'System'
      }
    }))
  }

  getRects () {
    return this.props.board.rects || []
  }

  findRect (id) {
    const rects = this.getRects()
    const index = findIndex(rects, {id})
    if (index < 0) return null

    return rects[index]
  }

  ////////////////////

  onClickAddItem () {
    this.props.showWfRectModal(true)
  }

  onCloseWfRectModal () {
    this.props.showWfRectModal(false)
  }

  onSaveWfRect (params) {
    if (!params.id) {
      params.id = guid()
      params.map = {
        x: 100, y: 100,
        lines: []
      }
      this.props.addGaugeRect(params, this.props.board)
    } else {
      this.props.updateGaugeRect(params, this.props.board)
    }
  }

  ////////////////////

  onClickEditItem () {
    const rect = this.getSelectedRect()
    if (!rect) return showAlert('Please choose rect')

    this.props.showWfRectModal(true, rect)
  }

  onClickShowSearch (rect) {
    if (!rect) return null
  }

  ////////////////////
  renderRect (rect, index) {
    return (
      <RectItem
        {...this.props}
        key={rect.id || index}
        rect={rect}
        searchList={this.getSearchList()}
        onUpdateColor={this.onUpdateRectState.bind(this)}
      />
    )
  }

  renderWfRectModal () {
    if (!this.props.wfRectModalOpen) return null
    const list = this.getSearchList()
    const searchList = list.map(p => ({
      label: p.name,
      value: p.id
    }))
    return (
      <WfRectModal
        searchList={searchList}
        editWfRect={this.props.editWfRect}
        onSubmit={this.onSaveWfRect.bind(this)}
        onHide={this.onCloseWfRectModal.bind(this)}/>
    )
  }

  renderMenu () {
    return (
      <div className="text-right" style={{position: 'absolute', top: -45, right: 0}}>
        <IconButton onTouchTap={this.onClickAddItem.bind(this)}><AddCircleIcon/></IconButton>
        <IconButton onTouchTap={this.onClickEditItem.bind(this)}><InfoIcon/></IconButton>
      </div>
    )
  }

  render () {
    return (
      <div className="flex-1">
        {this.renderMenu()}
        {this.getRects().map(this.renderRect.bind(this))}
        <div id="graph" className="graph-base" style={{width: '100%', height: '100%'}}></div>
        {this.renderWfRectModal()}
      </div>
    )
  }
}
