import classnames from 'classnames';
import React, { Component } from 'react';
import { AutoSizer, MultiGrid } from 'react-virtualized';
import { stringify, parse } from '../../libs/SheetClip';
import copy from 'copy-to-clipboard';
import './style.css';

let isMouseDown = false;
let startRowIndex = null;
let startCellIndex = null;
export default class Spreadsheet extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      cellValues: {},
      focusedColumnIndex: null,
      focusedRowIndex: null,
      dragSelected: {},
      aDragSelected: [],
      cellSelected: null,
      cellEdit: null,
    };

    this._multiGrid = React.createRef();
  }

  setMouseDown = () => {
    isMouseDown = false;
  };

  componentDidMount() {
    window.addEventListener('mouseup', this.setMouseDown);
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this.setMouseDown);
  }

  /**
   * listen user pass value to selected cells
   * @param {*} e
   * @returns
   */
  handlePastEvent = (e) => {
    if (!this.state.cellSelected) {
      return;
    }

    // parse data to array from clipboardData
    const clipboardData = parse(e.clipboardData.getData('text/plain'));
    const updateState = {};
    const { aDragSelected, cellValues, cellSelected } = this.state;
    let rowIndex = aDragSelected[0][0].split('-')[0];
    let columnIndex = aDragSelected[0][0].split('-')[0];

    // loop row
    for (let iRow = 0; iRow < clipboardData.length; iRow++) {
      if (iRow > 0) {
        rowIndex++;
      }
      columnIndex = cellSelected.columnIndex - 1;

      // loop cell
      for (let iColumn = 0; iColumn < clipboardData[iRow].length; iColumn++) {
        if (iColumn > 0) {
          columnIndex++;
        }

        if (aDragSelected[iRow] && aDragSelected[iRow][iColumn]) {
          updateState[aDragSelected[iRow][iColumn]] =
            clipboardData[iRow][iColumn];
        } else {
          updateState[rowIndex + '-' + columnIndex] =
            clipboardData[iRow][iColumn];
        }
      }
    }
    this.setState({ cellValues: { ...cellValues, ...updateState } });
  };

  /**
   * render cell with condition
   * @param {*} param0
   * @returns
   */
  _cellRenderer = ({ columnIndex, key, rowIndex, style }) => {
    if (columnIndex === 0 && rowIndex === 0) {
      return <div key={key} style={style} />;
    }

    if (columnIndex === 0) {
      return this._cellRendererLeft({ columnIndex, key, rowIndex, style });
    }

    if (rowIndex === 0) {
      return this._cellRendererTop({ columnIndex, key, rowIndex, style });
    }
    return this._cellRendererMain({ columnIndex, key, rowIndex, style });
  };

  // render vertical cell
  _cellRendererLeft = ({ columnIndex, key, rowIndex, style }) => {
    const { focusedRowIndex } = this.state;

    return (
      <div
        className={classnames('FixedGridCell', {
          FixedGridCellFocused: rowIndex === focusedRowIndex,
        })}
        key={key}
        style={style}
      >
        {rowIndex}
      </div>
    );
  };

  /**
   * on click to cell
   */
  onCellClick = () => {
    this.setState({
      cellEdit: null,
    });
  };

  /**
   * listen user copy after select a cell or drag to select multiple cell
   * save data to clipboard
   * @param {*} event
   */
  handleCopyEvent = (event) => {
    event.preventDefault();
    event.nativeEvent.stopImmediatePropagation();

    const valuesSelected = [];
    const { aDragSelected, cellValues } = this.state;
    for (let i = 0; i < aDragSelected.length; i++) {
      let rowData = [];
      for (let j = 0; j < aDragSelected[i].length; j++) {
        const tKey = aDragSelected[i][j];
        if (cellValues[tKey] !== undefined) {
          rowData.push(cellValues[tKey]);
        } else {
          rowData.push('');
        }
      }
      valuesSelected.push(rowData);
    }
    const textPlain = stringify(valuesSelected);
    copy(textPlain);
  };

  /**
   * double click to edit cell value
   * @param {*} data
   * @returns
   */
  handleDoubleClickCell = (data) => (event) => {
    this.setState({
      cellEdit: data,
    });
  };

  /**
   * event on change textarea value
   * @param {*} data
   * @returns
   */
  onChangeCellValue = (data) => (event) => {
    this.setState({
      cellValues: {
        ...this.state.cellValues,
        [data.key]: event.target.value,
      },
    });
  };

  _cellRendererMain = (data) => {
    const { columnIndex, key, rowIndex, style } = data;
    const {
      cellValues,
      focusedColumnIndex,
      focusedRowIndex,
      dragSelected,
      cellEdit,
    } = this.state;

    const value = cellValues[key] || '';

    const isFocused =
      columnIndex === focusedColumnIndex && rowIndex === focusedRowIndex;

    if (cellEdit && cellEdit.key === key) {
      return (
        <div
          key={key}
          style={style}
          className={classnames('MainGridCell', {
            MainGridCellFocused: isFocused,
            'selection-area': !!dragSelected[key],
            'edit-area': cellEdit.key === key,
          })}
          onMouseDown={this.handleMouseEvent({ columnIndex, key, rowIndex })}
          onMouseOver={this.handleMouseEvent({ columnIndex, key, rowIndex })}
        >
          <textarea
            className="cell-textarea"
            onChange={this.onChangeCellValue(data)}
            autoFocus
            rows={3}
            value={value}
          />
        </div>
      );
    }

    return (
      <div
        key={key}
        className={classnames('MainGridCell', {
          MainGridCellFocused: isFocused,
          'selection-area': !!dragSelected[key],
        })}
        style={style}
        onClick={this.onCellClick}
        onMouseDown={this.handleMouseEvent({ columnIndex, key, rowIndex })}
        onMouseOver={this.handleMouseEvent({ columnIndex, key, rowIndex })}
        onDoubleClick={this.handleDoubleClickCell(data)}
      >
        <div>{value}</div>
      </div>
    );
  };

  /**
   * drag to select cells
   * @param {*} cell
   */
  dragSelectTo = (cell) => {
    var cellIndex = cell.columnIndex;
    var rowIndex = cell.rowIndex;

    var rowStart, rowEnd, cellStart, cellEnd;

    if (rowIndex < startRowIndex) {
      rowStart = rowIndex;
      rowEnd = startRowIndex;
    } else {
      rowStart = startRowIndex;
      rowEnd = rowIndex;
    }

    if (cellIndex < startCellIndex) {
      cellStart = cellIndex;
      cellEnd = startCellIndex;
    } else {
      cellStart = startCellIndex;
      cellEnd = cellIndex;
    }
    const result = {};
    const aResult = [];

    rowStart = rowStart - 1;
    rowEnd = rowEnd - 1;
    cellStart = cellStart - 1;
    cellEnd = cellEnd - 1;

    for (let i = rowStart; i <= rowEnd; i++) {
      const keySelectedInRow = [];
      for (let j = cellStart; j <= cellEnd; j++) {
        result[i + '-' + j] = true;
        keySelectedInRow.push(i + '-' + j);
      }
      aResult.push(keySelectedInRow);
    }

    // set state selected cells
    this.setState({ dragSelected: result, aDragSelected: aResult });
  };

  /**
   * listen mouse event
   * @param {*} data
   * @returns
   */
  handleMouseEvent = (data) => (event) => {
    if (event.type === 'mousedown') {
      isMouseDown = true;
      const { cellEdit } = this.state;
      if (cellEdit && data.key !== cellEdit.key) {
        this.setState({
          cellEdit: null,
        });
      }

      if (event.shiftKey) {
        this.dragSelectTo(data);
      } else {
        startCellIndex = data.columnIndex;
        startRowIndex = data.rowIndex;
        this.setState({
          dragSelected: { [data.key]: true },
          aDragSelected: [[data.key]],
          cellSelected: data,
        });
      }
    }

    if (event.type === 'mouseover' && isMouseDown) {
      this.setState({
        cellEdit: null,
      });
      this.dragSelectTo(data);
    }
  };

  /**
   * render horizontal column
   * @param {*} param0
   * @returns
   */
  _cellRendererTop = ({ columnIndex, key, rowIndex, style }) => {
    const { focusedColumnIndex } = this.state;
    return (
      <div
        className={classnames('FixedGridCell', {
          FixedGridCellFocused: columnIndex === focusedColumnIndex,
        })}
        key={key}
        style={style}
      >
        {columnIndex}
      </div>
    );
  };

  _columnWidth = ({ index }) => {
    return index === 0 ? 80 : 100;
  };

  _setRef = (ref) => {
    this._multiGrid = ref;
  };

  onKeyDown = (event) => {
    const { aDragSelected, cellValues, cellEdit } = this.state;

    // reset value cell if user press delete
    if (event.keyCode === 8 && !cellEdit) {
      const result = {};

      aDragSelected.forEach((rowArr) => {
        rowArr.forEach((cell) => {
          result[cell] = undefined;
        });
      });
      this.setState({ cellValues: { ...cellValues, ...result } });
    }

    // reset cellEdit when user press Tab
    if (event.keyCode === 9 && cellEdit) {
      this.setState({
        cellEdit: null,
      });
    }
  };

  render() {
    return (
      <div
        className="excel-container"
        onPaste={this.handlePastEvent}
        onCopy={this.handleCopyEvent}
        onKeyDown={this.onKeyDown}
      >
        <AutoSizer>
          {(props) => {
            const { width, height } = props;
            return (
              <MultiGrid
                cellRenderer={this._cellRenderer}
                columnWidth={this._columnWidth}
                columnCount={1000}
                fixedColumnCount={1}
                fixedRowCount={1}
                height={height}
                ref={this._setRef}
                rowHeight={40}
                rowCount={1000000}
                style={{
                  border: '1px solid #dadada',
                }}
                styleBottomLeftGrid={{
                  backgroundColor: '#ffffff',
                }}
                styleTopLeftGrid={{
                  backgroundColor: '#f3f3f3',
                  borderBottom: '3px solid #bcbcbc',
                  borderRight: '3px solid #bcbcbc',
                }}
                styleTopRightGrid={{
                  backgroundColor: '#f3f3f3',
                }}
                width={width}
              />
            );
          }}
        </AutoSizer>
      </div>
    );
  }
}
