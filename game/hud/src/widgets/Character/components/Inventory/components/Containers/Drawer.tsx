/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 */

import * as React from 'react';
import * as _ from 'lodash';
import styled from 'react-emotion';
import { client, webAPI, Tooltip } from '@csegames/camelot-unchained';

import * as base from '../InventoryBase';
import { InventorySlotItemDef, slotDimensions } from '../InventorySlot';
import DrawerView from './DrawerView';
import InventoryRowActionButton from '../InventoryRowActionButton';
import { rowActionIcons } from '../../../../lib/constants';
import { calcRowsForContainer, getContainerColor, createMoveItemRequestToContainerPosition } from '../../../../lib/utils';
import {
  ContainerDrawersFragment,
  InventoryItemFragment,
  ContainedItemsFragment,
  PermissibleHolderFragment,
} from '../../../../../../gqlInterfaces';

declare const toastr: any;

const Container = styled('div')`
  position: relative;
  display: flex;
`;

const HeaderContent = styled('div')`
  position: relative;
  height: 30px;
  width: 160px;
  padding-left: 15px;
  background: ${(props: any) => props.showImg ? 'url(images/inventory/sub_title.png)' : 'transparent' };
  background-size: 100% 100%;
  &:before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: ${(props: any) => props.showImg ? 'url(images/inventory/sub_title.png)' : 'transparent' };
    background-size: 100% 100%;
  }
`;

const MainContent = styled('div')`
  padding: 0 10px;
`;

const FooterContainer = styled('div')`
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  padding-right: 3px;
`;

const RequirementsContainer = styled('div')`
  display: flex;
  align-items: center;
  height: 100%;
`;

const RequirementIcon = styled('span')`
  display: flex;
  font-size: 15px;
  margin-right: 5px;
  color: ${(props: any) => props.color};
`;

const PermissionContainer = styled('div')`
  background: rgba(0,0,0,0.5);
  padding: 0 5px;
`;

const PermissionIcon = styled('span')`
  opacity: ${(props: any) => props.opacity};
  padding: 0 5px 0 0;
  vertical-align: middle;
`;

export interface DrawerCurrentStats {
  totalUnitCount: number;
  weight: number;
}

// TODO: clean up these fkn drawer props, they don't need to extend InventoryBaseProps
export interface DrawerProps extends base.InventoryBaseProps {
  index: number;
  slotsPerRow: number;
  containerID: string[];
  drawer: ContainerDrawersFragment;
  containerItem: InventoryItemFragment;
  permissions: PermissibleHolderFragment;
  syncWithServer: () => void;

  // Will be sent to InventoryBody component who will act as the state machine for all container -> drawer -> slot
  onChangeContainerIdToDrawerInfo: (newObj: base.ContainerIdToDrawerInfo) => void;
  containerIdToDrawerInfo: base.ContainerIdToDrawerInfo;
  bodyWidth: number;

  // TODO: Get rid of these guys...
  footerWidth?: string | number;
  marginTop?: number;
}

export interface DrawerState extends base.InventoryBaseState {
}

class Drawer extends React.Component<DrawerProps, DrawerState> {
  private contentRef: any;
  constructor(props: DrawerProps) {
    super(props);
    this.state = {
      ...base.defaultInventoryBaseState(),
    };
  }
  public render() {
    const { drawer, containerItem, containerID, permissions, syncWithServer } = this.props;
    const { stats, requirements } = drawer;

    // Grab items from containerIdToDrawerInfo (Managed by CharacterMain)
    const container = this.props.containerIdToDrawerInfo[containerID[containerID.length - 1]];
    const drawerInfo = container ? container.drawers[drawer.id] : {};
    const drawerItems: ContainedItemsFragment[] = [];
    Object.keys(drawerInfo).forEach((_key) => {
      drawerItems.push(drawerInfo[_key].item);
    });

    // Get header info
    const { totalUnitCount, weight } = base.getContainerHeaderInfo(drawerItems);

    // Create rows
    const { rows, rowData } = base.createRowElementsForContainerItems({
      state: this.state,
      props: this.props,
      itemData: { items: drawerItems },
      containerID,
      drawerID: drawer.id,
      onDropOnZone: this.onDropOnZone,
      containerPermissions: permissions ? permissions.userPermissions : 0,
      drawerMaxStats: stats,
      drawerCurrentStats: { totalUnitCount, weight },
      syncWithServer,
      bodyWidth: this.props.bodyWidth,
    });

    const requirementIconColor = getContainerColor(containerItem, 0.3);
    return (
      <DrawerView
        containerItem={this.props.containerItem}
        marginTop={this.props.marginTop}
        footerWidth={this.props.footerWidth}
        headerContent={() => (
          <HeaderContent showImg={this.props.index !== 0}>
            <RequirementsContainer>
              {requirements &&
                <Tooltip content={() => (
                  <div>{requirements.description}</div>
                )}>
                  <RequirementIcon
                    className={requirements.icon}
                    color={requirementIconColor}
                  />
                </Tooltip>
              }
            </RequirementsContainer>
          </HeaderContent>
        )}
        mainContent={() => (
          <Container>
            <MainContent>
              {rows}
            </MainContent>
          </Container>
        )}
        footerContent={() => (
          <FooterContainer>
            <InventoryRowActionButton
              tooltipContent={'Add Empty Row'}
              iconClass={rowActionIcons.addRow}
              onClick={this.addRowOfSlots}
            />
            <InventoryRowActionButton
              tooltipContent={'Remove Empty Row'}
              iconClass={rowActionIcons.removeRow}
              onClick={() => this.removeRowOfSlots(rowData)}
              disabled={base.inventoryContainerRemoveButtonDisabled(rowData)}
            />
            <InventoryRowActionButton
              tooltipContent={'Prune Empty Rows'}
              iconClass={rowActionIcons.pruneRows}
              onClick={() => this.pruneRowsOfSlots(rowData)}
              disabled={base.inventoryContainerRemoveButtonDisabled(rowData)}
            />
            {stats.maxItemMass !== -1 &&
              <PermissionContainer>
                <PermissionIcon className='icon-ui-weight' />
                {weight} / {stats.maxItemMass}
              </PermissionContainer>
            }
            {stats.maxItemCount !== -1 &&
              <PermissionContainer>
                <PermissionIcon className='icon-ui-bag' />
                {totalUnitCount} / {stats.maxItemCount}
              </PermissionContainer>
            }
          </FooterContainer>
        )}
        contentRef={r => this.contentRef = r}>
      </DrawerView>
    );
  }

  public componentDidMount() {
    this.initialize(this.props);
    window.addEventListener('resize', () => this.initialize(this.props));
  }

  public shouldComponentUpdate(nextProps: DrawerProps, nextState: DrawerState) {
    return !_.isEqual(this.props.containerItem, nextProps.containerItem) ||
      !_.isEqual(this.props.drawer.containedItems, nextProps.drawer.containedItems) ||
      !_.isEqual(this.props.inventoryItems, nextProps.inventoryItems) ||
      !_.isEqual(this.props.containerIdToDrawerInfo, nextProps.containerIdToDrawerInfo) ||
      !_.isEqual(this.props.containerID, nextProps.containerID) ||
      this.props.index !== nextProps.index ||
      this.props.bodyWidth !== nextProps.bodyWidth ||
      this.props.searchValue !== nextProps.searchValue ||
      !_.isEqual(this.props.activeFilters, nextProps.activeFilters) ||
      this.props.slotsPerRow !== nextProps.slotsPerRow ||

      this.state.slotsPerRow !== nextState.slotsPerRow ||
      this.state.slotCount !== nextState.slotCount ||
      this.state.rowCount !== nextState.rowCount;
  }

  public componentWillUnmount() {
    window.removeEventListener('resize', () => this.initialize(this.props));
  }

  // set up rows from scratch / works as a re-initialize as well
  private initialize = (props: DrawerProps) => {
    this.setState(() => this.internalInit(this.state, props));
  }

  private internalInit = (state: DrawerState, props: DrawerProps) => {
    if (!props.bodyWidth) return;
    const rowData = this.getRowsAndSlots(props);
    return base.distributeItems(rowData, { items: [] },  state, props);
  }

  private getRowsAndSlots = (props: DrawerProps) => {
    const { drawer, containerID, containerIdToDrawerInfo } = props;
    const container = containerIdToDrawerInfo[containerID[containerID.length - 1]];
    const drawerInfo = container ? container.drawers[drawer.id] : {};
    const drawerItems: ContainedItemsFragment[] = [];
    Object.keys(drawerInfo).forEach((_key) => {
      drawerItems.push(drawerInfo[_key].item);
    });
    const rowData = calcRowsForContainer(
      { width: props.bodyWidth, height: this.contentRef.getBoundingClientRect().height },
      slotDimensions,
      drawerItems,
    );

    return rowData;
  }

  private onDropOnZone = (dragItemData: base.InventoryDataTransfer, dropZoneData: base.InventoryDataTransfer) => {
    // These will be modified throughout the function
    const containerIdToDrawerInfo = { ...this.props.containerIdToDrawerInfo };
    const inventoryItems = [...this.props.inventoryItems];

    const dragContainerID = dragItemData.containerID && dragItemData.containerID[dragItemData.containerID.length - 1];
    const dropContainerID = dropZoneData.containerID && dropZoneData.containerID[dropZoneData.containerID.length - 1];

    const newDragItem: InventoryItemFragment = {
      ...dragItemData.item,
      location: {
        inContainer: {
          position: dropZoneData.position,
        },
        inventory: null,
      },
    };

    const newDropItem: InventoryItemFragment = dropZoneData.item && {
      ...dropZoneData.item,
      location: {
        inContainer: {
          position: dragItemData.position,
        },
        inventory: null,
      },
    };

    if (newDropItem) {
      if (dragContainerID) {
        containerIdToDrawerInfo[dragContainerID].drawers[dragItemData.drawerID][dragItemData.position] = {
          slot: dragItemData.position,
          drawerId: dragItemData.drawerID,
          containerId: dragContainerID,
          item: newDropItem,
        };
      }
    }

    // Move item to container
    containerIdToDrawerInfo[dropContainerID].drawers[dropZoneData.drawerID][dropZoneData.position] = {
      slot: dropZoneData.position,
      drawerId: dropZoneData.drawerID,
      containerId: dropContainerID,
      item: newDragItem,
    };

    const indexOfDropZoneContainer = _.findIndex(inventoryItems, _item => _item.id === this.props.containerID[0]);
    const newDropContainerDrawers =
      this.getUpdatedDropContainer(
        dropZoneData,
        newDragItem,
        newDropItem,
        inventoryItems,
        indexOfDropZoneContainer,
      );

    inventoryItems[indexOfDropZoneContainer] = {
      ...inventoryItems[indexOfDropZoneContainer],
      containerDrawers: newDropContainerDrawers,
    };

    // Drag item was in container
    if (dragContainerID) {
      // Delete drag slot if moving to empty slot
      if (!newDropItem) {
        delete containerIdToDrawerInfo[dragContainerID].drawers[dragItemData.drawerID][dragItemData.position];
      }

      const indexOfTopDragItemContainer = _.findIndex(inventoryItems, _item => _item.id === dragItemData.containerID[0]);
      const newDragContainerDrawers =
        this.getUpdatedDragContainer(
          dragItemData,
          newDragItem,
          newDropItem,
          dropZoneData,
          inventoryItems,
          indexOfTopDragItemContainer,
        );

      inventoryItems[indexOfTopDragItemContainer] = {
        ...inventoryItems[indexOfTopDragItemContainer],
        containerDrawers: newDragContainerDrawers as any,
      };

    } else {
      // Drag item is in regular inventory
      const indexOfDragItem = _.findIndex(inventoryItems, _item => _item.id === dragItemData.item.id);
      if (newDropItem) {
        inventoryItems[indexOfDragItem] = newDropItem;
      } else {
        inventoryItems[indexOfDragItem] = null;
      }
    }

    this.props.onChangeInventoryItems(_.compact(inventoryItems));
    this.props.onChangeContainerIdToDrawerInfo(containerIdToDrawerInfo);

    // Make a move request to api server
    const moveRequests = [createMoveItemRequestToContainerPosition(dragItemData, dropZoneData)];

    if (newDropItem) {
      moveRequests.push(createMoveItemRequestToContainerPosition(dropZoneData, dragItemData));
    }

    webAPI.ItemAPI.BatchMoveItems(
      webAPI.defaultConfig,
      client.loginToken,
      client.shardID,
      client.characterID,
      moveRequests,
    ).then((res) => {
      // If request fails for any reason
      if (!res.ok) {
        const data = JSON.parse(res.data);
        if (data.FieldCodes && data.FieldCodes.length > 0) {
          toastr.error(data.FieldCodes[0].Message, 'Oh No!', { timeout: 3000 });
        } else {
          // This means api server failed move item request but did not have a message about what happened
          toastr.error('An error occured', 'Oh No!', { timeout: 3000 });
        }

        // Sync with server, which should just revert the state
        this.props.syncWithServer();
      }
    });
  }

  private getUpdatedDropContainer = (dropZoneData: base.InventoryDataTransfer,
                                      newDragItem: InventoryItemFragment,
                                      newDropItem: InventoryItemFragment,
                                      inventoryItems: InventoryItemFragment[],
                                      indexOfDropZoneContainer: number) => {
    let newDropContainerDrawers;
    if (dropZoneData.containerID.length > 1) {
      // Dropped in a nested container
      newDropContainerDrawers = _.map(inventoryItems[indexOfDropZoneContainer].containerDrawers, (_drawer) => {
        const dropZoneContainer = _.find(_drawer.containedItems, _containedItem =>
          _containedItem.id === dropZoneData.containerID[dropZoneData.containerID.length - 1]);
        if (dropZoneContainer) {
          // Look for item in container drawer
          const newDropZoneDrawer = dropZoneContainer.containerDrawers.map((_dropZoneDrawer) => {
            const filteredDrawer = _.filter(_drawer.containedItems, _containedItem =>
              _containedItem.id !== newDragItem.id && (newDropItem ? _containedItem.id !== newDropItem.id : true));
            return {
              ..._dropZoneDrawer,
              containedItems: _.compact([
                ...filteredDrawer,
                newDragItem,
                newDropItem,
              ]),
            };
          });

          const newContainedItem = {
            ...dropZoneContainer,
            containerDrawers: newDropZoneDrawer,
          };

          return {
            ..._drawer,
            containedItems: [
              ..._.filter(_drawer.containedItems, _containedItem => _containedItem.id !== dropZoneContainer.id),
              newContainedItem,
            ],
          };
        }
        return _drawer;
      });
    } else {
      // Dropped in a top level container inside the inventory
      newDropContainerDrawers = _.map(inventoryItems[indexOfDropZoneContainer].containerDrawers, (_drawer) => {
        // Add item to drop zone drawer
        if (_drawer.id === dropZoneData.drawerID) {
          const filteredDrawer = _.filter(_drawer.containedItems, _containedItem =>
            _containedItem.id !== newDragItem.id && (newDropItem ? _containedItem.id !== newDropItem.id : true));
          return {
            ..._drawer,
            containedItems: _.compact([
              ...filteredDrawer,
              newDragItem,
              newDropItem,
            ]),
          };
        }

        return _drawer;
      });
    }

    return newDropContainerDrawers;
  }

  private getUpdatedDragContainer = (dragItemData: base.InventoryDataTransfer,
                                      newDragItem: InventoryItemFragment,
                                      newDropItem: InventoryItemFragment,
                                      dropZoneData: base.InventoryDataTransfer,
                                      inventoryItems: InventoryItemFragment[],
                                      indexOfTopDragItemContainer: number) => {
    let newDragContainerDrawers;
    const dragContainerID = dragItemData.containerID[dragItemData.containerID.length - 1];
    if (dragItemData.containerID.length > 1) {
      // Drag item came from a NESTED container
      newDragContainerDrawers = _.map(inventoryItems[indexOfTopDragItemContainer].containerDrawers, (_drawer) => {
        const dragItemContainer = _.find(_drawer.containedItems, _containedItem => _containedItem.id === dragContainerID);
        if (dragItemContainer) {
          // Look for item in container drawer
          const newDragItemDrawer = dragItemContainer.containerDrawers.map((_dragItemDrawer) => {

            let newContainedItems;
            if (!newDropItem) {
              // drop zone was an EMPTY slot
              newContainedItems = dragItemData.drawerID !== dropZoneData.drawerID ?
              _.filter(_dragItemDrawer.containedItems, _containedItem => _containedItem.id !== dragItemData.item.id) : [
                ..._.filter(_dragItemDrawer.containedItems, _containedItem => _containedItem.id !== dragItemData.item.id),
                newDragItem,
              ];
            } else {
              // SWAPPING with item in drop zone
              newContainedItems = dragItemData.drawerID !== dropZoneData.drawerID ? [
                ..._.filter(_dragItemDrawer.containedItems, _containedItem => _containedItem.id !== dragItemData.item.id),
                newDropItem,
              ] : [
                ..._.filter(_dragItemDrawer.containedItems, _containedItem => _containedItem.id !== dragItemData.item.id),
                newDragItem,
                newDropItem,
              ];
            }

            return {
              ..._dragItemDrawer,
              containedItems: newContainedItems,
            };
          });

          const newContainedItem = {
            ...dragItemContainer,
            containerDrawers: newDragItemDrawer,
          };
          return {
            ..._drawer,
            containedItems: [
              ..._.filter(_drawer.containedItems, _containedItem => _containedItem.id !== dragItemContainer.id),
              newContainedItem,
            ],
          };
        }
        return _drawer;
      });
    } else {
      newDragContainerDrawers = _.map(inventoryItems[indexOfTopDragItemContainer].containerDrawers, (_drawer) => {
        if (_drawer.id === dragItemData.drawerID) {
          // IF drag item going to a different drawer then just delete drag item from previous drawer
          // ELSE drag item is moved to a position in the same drawer, just update the drag item
          let newDrawer;
          if (!newDropItem) {
            // EMPTY
            newDrawer = dragItemData.drawerID !== dropZoneData.drawerID ?
            _.filter(_drawer.containedItems, _containedItem => _containedItem.id !== dragItemData.item.id) : [
              ..._.filter(_drawer.containedItems, _containedItem => _containedItem.id !== dragItemData.item.id),
              newDragItem,
            ];
          } else {
            // SWAPPING
            newDrawer = dragItemData.drawerID !== dropZoneData.drawerID ? [
              ..._.filter(_drawer.containedItems, _containedItem => _containedItem.id !== dragItemData.item.id),
              newDropItem,
            ] : [
              ..._.filter(_drawer.containedItems, _containedItem => _containedItem.id !== dragItemData.item.id),
              newDragItem,
              newDropItem,
            ];
          }
          return {
            ..._drawer,
            containedItems: newDrawer,
          };
        }

        return _drawer;
      });
    }

    return newDragContainerDrawers;
  }

  private addRowOfSlots = () => {
    this.setState(base.addRowOfSlots);
  }

  private removeRowOfSlots = (rowData: InventorySlotItemDef[][]) => {
    const heightOfBody = this.contentRef.getBoundingClientRect().height;
    this.setState((state, props) => base.removeRowOfSlots(state, rowData, heightOfBody, true));
  }

  private pruneRowsOfSlots = (rowData: InventorySlotItemDef[][]) => {
    const heightOfBody = this.contentRef.getBoundingClientRect().height;
    this.setState((state, props) => base.pruneRowsOfSlots(state, rowData, heightOfBody, true));
  }
}

export default Drawer;
