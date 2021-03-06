/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as _ from 'lodash';
import { ql, client, utils, Vec3F, Euler3f, ItemPermissions } from '@csegames/camelot-unchained';
import { inventoryFilterButtons, colors, nullVal, emptyStackHash } from './constants';
import { DrawerCurrentStats } from '../components/Inventory/components/Containers/Drawer';
import { SlotNumberToItem, InventoryDataTransfer } from '../components/Inventory/components/InventoryBase';
import { ActiveFilters } from '../components/Inventory/Inventory';
import {
  InventoryItemFragment,
  ContainerDrawersFragment,
  GearSlotDefRefFragment,
  ContainedItemsFragment,
} from '../../../gqlInterfaces';

declare const toastr: any;

export interface InventoryBodyDimensions {
  width: number;
  height: number;
}

export const prettifyText = (slotName: string) => {
  if (slotName) return slotName.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => { return str.toUpperCase(); });
};

export function calcRowsForContainer(bodyDimensions: InventoryBodyDimensions,
                                      slotDimensions: number,
                                      containerSlots: ContainedItemsFragment[],
                                      gutterSize: number = 65) {
  const lastItem = _.sortBy(containerSlots, a => a.location.inContainer.position)[containerSlots.length - 1];
  const lastItemSlotPos = lastItem ? lastItem.location.inContainer.position : 0;
  const slotsPerRow = calcSlotsPerRow(bodyDimensions, slotDimensions, gutterSize);
  const rowCount = lastItemSlotPos + 1 > slotsPerRow ? Math.ceil((lastItemSlotPos + 1) / slotsPerRow) : 1;
  const slotCount = Math.max(slotsPerRow, lastItemSlotPos + 1);

  return {
    rowCount,
    slotCount,
    slotsPerRow,
  };
}

export function calcRowAndSlots(bodyDimensions: InventoryBodyDimensions,
                                slotDimensions: number,
                                minSlots: number,
                                gutterSize: number = 65) {
  const slotsPerRow = calcSlotsPerRow(bodyDimensions, slotDimensions, gutterSize);
  const slotCountAndRows = calcRows(bodyDimensions, slotDimensions, minSlots, slotsPerRow);
  return {
    slotsPerRow,
    ...slotCountAndRows,
  };
}

export function searchIncludesSection(searchValue: string, sectionTitle: string) {
  if (sectionTitle) {
    if (searchValue !== '') {
      return _.includes(sectionTitle.toLowerCase().replace(/\s/g, ''), searchValue.toLowerCase().replace(/\s/g, '')) ||
      _.includes(searchValue.toLowerCase().replace(/\s/g, ''), sectionTitle.toLowerCase().replace(/\s/g, ''));
    } return true;
  }
  return false;
}

export function calcSlotsPerRow(bodyDimensions: InventoryBodyDimensions, slotDimensions: number, gutterSize: number = 65) {
  return Math.floor(
    (bodyDimensions.width - gutterSize) /* gutters & scrollbar */
    /
    (slotDimensions + 4), /* slot width / height */
  );
}

export function calcRows(bodyDimensions: InventoryBodyDimensions,
                          slotDimensions: number,
                          minSlots: number,
                          slotsPerRow: number) {
  const { height } = bodyDimensions;
  const minRows = Math.ceil(height / (slotDimensions + 4));
  // how many slots do we need to fit in rows
  const slotsToFit = Math.max(minSlots, minRows * slotsPerRow);
  // how many slots there are actually with full rows.
  // (will fill a row to fit or add an extra row)
  const slotCount = (slotsPerRow - (slotsToFit % slotsPerRow)) + slotsToFit;
  const rowCount = slotCount / slotsPerRow;

  return {
    slotCount,
    rowCount,
  };
}

export function getDimensionsOfElement(div: HTMLElement) {
  if (div) {
    return div.getBoundingClientRect();
  }
}

export function createMoveItemRequestToWorldPosition(item: InventoryItemFragment,
    worldPosition: Vec3F,
    rotation: Euler3f): any {
  return {
    moveItemID: item.id,
    stackHash: item.stackHash,
    unitCount: -1,
    to: {
      entityID: nullVal,
      worldPosition,
      rotation,
      location: 'Ground',
      voxSlot: 'Invalid',
    },
    from: {
      entityID: nullVal,
      characterID: client.characterID,
      position: getItemInventoryPosition(item),
      containerID: nullVal,
      gearSlotIDs: [],
      location: 'Inventory',
      voxSlot: 'Invalid',
    },
  };
}

export function createMoveItemRequestToInventoryPosition(item: InventoryItemFragment, position: number): any {
  return {
    moveItemID: item.id,
    stackHash: item.stackHash,
    unitCount: -1,
    to: {
      entityID: nullVal,
      characterID: client.characterID,
      position,
      containerID: nullVal,
      gearSlotIDs: [],
      location: 'Inventory',
      voxSlot: 'Invalid',
    },
    from: {
      entityID: nullVal,
      characterID: client.characterID,
      position: getItemInventoryPosition(item),
      containerID: nullVal,
      gearSlotIDs: [],
      location: 'Inventory',
      voxSlot: 'Invalid',
    },
  };
}

export function createMoveItemRequestToContainerPosition(oldPosition: InventoryDataTransfer,
                                                          newPosition: InventoryDataTransfer): any {
  const oldItem = oldPosition.item;
  const newPosContainerID = newPosition.containerID ?
    newPosition.containerID[newPosition.containerID.length - 1] : newPosition.containerID;
  const oldPosContainerID = oldPosition.containerID ?
    oldPosition.containerID[oldPosition.containerID.length - 1] : oldPosition.containerID;

  return {
    moveItemID: oldItem.id,
    stackHash: oldItem.stackHash,
    unitCount: -1,
    to: {
      entityID: nullVal,
      characterID: client.characterID,
      position: newPosition.position,
      containerID: newPosContainerID,
      drawerID: newPosition.drawerID,
      gearSlotIDs: [],
      location: newPosition.containerID ? 'Container' : 'Inventory',
      voxSlot: 'Invalid',
    },
    from: {
      entityID: nullVal,
      characterID: client.characterID,
      position: oldItem.location.inContainer ? oldItem.location.inContainer.position : oldItem.location.inventory.position,
      containerID: oldPosContainerID,
      drawerID: oldPosition.drawerID,
      gearSlotIDs: [],
      location: oldPosition.containerID ? 'Container' : 'Inventory',
      voxSlot: 'Invalid',
    },
  };
}

export function getInventoryDataTransfer(payload: {
  item: InventoryItemFragment,
  position: number,
  location: string,
  containerID?: string[],
  drawerID?: string;
  gearSlots?: GearSlotDefRefFragment[],
}): InventoryDataTransfer {
  if (!payload) {
    return null;
  }

  // A drag object will only have gearSlots attribute if it is currently equipped
  const { item, containerID, drawerID, gearSlots, position, location } = payload;

  return {
    containerID,
    drawerID,
    gearSlots,
    item,
    position,
    location,
  };
}

export function isCraftingItem(item: InventoryItemFragment) {
  if (!item) {
    return false;
  }
  if (item.staticDefinition) {
    switch (item.staticDefinition.itemType) {
      case 'Substance': return true;
      case 'Alloy': return true;
      default: return false;
    }
  }
  console.error('You provided an item to isCraftingItem() function that has staticDefinion of null');
  console.log(item);
}

export function isStackedItem(item: InventoryItemFragment) {
  if (item && item.stats) {
    return item.stats.item.unitCount > 1 || item.stackHash !== emptyStackHash;
  }

  console.log('You provided an item to isStackedItem() function that has stats of null');
  console.log(item);
  return false;
}

export function isContainerItem(item: InventoryItemFragment) {
  if (!item || !item.containerDrawers) {
    return false;
  }
  return _.isArray(item.containerDrawers);
}

export function isVoxItem(item: InventoryItemFragment) {
  if (!item) {
    return false;
  }
  return item.staticDefinition.isVox;
}

export function getIcon(item: InventoryItemFragment) {
  if (item.staticDefinition) {
    return item.staticDefinition.iconUrl;
  }
  console.error('You provided an item to getIcon() function that has staticDefinition of null');
  console.log(item);
}

export function itemHasPosition(item: InventoryItemFragment) {
  return getItemInventoryPosition(item) > -1;
}

export function getItemUnitCount(item: InventoryItemFragment) {
  if (item && item.stats && item.stats.item && item.stats.item.unitCount) {
    return item.stats.item.unitCount;
  }
  return -1;
}

export function getItemMass(item: InventoryItemFragment) {
  if (item && item.stats && item.stats.item && item.stats.item.totalMass) {
    return item.stats.item.totalMass;
  }
  return -1;
}

export function getItemQuality(item: InventoryItemFragment) {
  if (item && item.stats && item.stats.item && item.stats.item.quality) {
    return Number((item.stats.item.quality * 100));
  }
  return -1;
}

export function getItemInventoryPosition(item: InventoryItemFragment) {
  if (item && item.location && item.location.inventory && item.location.inventory) {
    return item.location.inventory.position;
  } else {
    return -1;
  }
}

export function getItemDefinitionId(item: InventoryItemFragment) {
  if (item && item.staticDefinition && item.staticDefinition.id) {
    return item.staticDefinition.id;
  }
  console.error('You provided an item to getItemDefinitionId() function that has staticDefinition of null');
  console.log(item);
}

export function getItemDefinitionName(item: InventoryItemFragment) {
  if (item && item.staticDefinition && item.staticDefinition.name) {
    return item.staticDefinition.name;
  }
  console.error('You provided an item to getItemDefinitionName() function that has staticDefinition of null');
  console.log(item);
}

export function generateStackGroupID(stackHash: string, stackGroupCounter: number) {
  return `${stackHash}:${stackGroupCounter++}`;
}

export function getItemInstanceID(item: InventoryItemFragment) {
  return item.id;
}

export function getItemMapID(item: InventoryItemFragment) {
  if (item && item.staticDefinition) {
    if (isCraftingItem(item)) {
      return item.staticDefinition.name + item.staticDefinition.id;
    } else if (isStackedItem(item)) {
      return item.staticDefinition.name + item.staticDefinition.id;
    } else {
      return item.id;
    }
  }
  console.error('You provided an item to getItemMapID() function that has staticDefinition of null');
}

export function getContainerID(item: InventoryItemFragment) {
  if (_.isArray(item.containerDrawers)) {
    // Is an actual container
    return item.id;
  } else {
    console.error(`${item.id} requested a containerID with getContainerID and is not a container!`);
  }
}

export function firstAvailableSlot(startWith: number, slotNumberToItem: SlotNumberToItem) {
  let slotNumber = startWith;
  while (true) {
    if (!slotNumberToItem[slotNumber]) return slotNumber;
    slotNumber++;
  }
}

export function hasActiveFilterButtons(activeFilters: ActiveFilters) {
  return activeFilters && Object.keys(activeFilters).length > 0;
}

export function hasFilterText(searchValue: string) {
  return searchValue && searchValue.trim() !== '';
}

export function shouldShowItem(item: InventoryItemFragment, activeFilters: ActiveFilters, searchValue: string) {
  const hasFilter = hasActiveFilterButtons(activeFilters);
  const hasSearch = hasFilterText(searchValue);
  const itemName = getItemDefinitionName(item);

    // Active filters compared to item gearSlots
  const doActiveFiltersIncludeItem = _.findIndex(_.values(activeFilters), (filter) => {
    return inventoryFilterButtons[filter.name].filter(item);
  }) > -1;

    // Search text compared to itemName
  const doesSearchValueIncludeItem = utils.doesSearchInclude(searchValue, itemName);

    // Do active filters and search include item?
  if (hasFilter && hasSearch) {
    return doActiveFiltersIncludeItem && doesSearchValueIncludeItem;

      // Do active filters include item?
  } else if (hasFilter && !hasSearch) {
    return doActiveFiltersIncludeItem;

    // Does search value include item?
  } else if (!hasFilter && hasSearch) {
    return doesSearchValueIncludeItem;

    // If there are no filters or searchValue, every item should be shown.
  } else {
    return true;
  }
}

export function getContainerColor(item: InventoryItemFragment, alpha?: number) {
  if (item && item.containerColor) {
    const { containerColor } = item;
    if (containerColor) {
      return `rgba(${containerColor.r}, ${containerColor.g}, ${containerColor.b}, ${alpha || 1})`;
    } else {
      return utils.lightenColor(colors.filterBackgroundColor, 5);
    }
  }

  console.error('You provided an undefined item to getContainerColor() function');
}

export function isContainerSlotVerified(dragDataTransfer: InventoryDataTransfer,
                                        dropDataTransfer: InventoryDataTransfer,
                                        dropContainerID: string[],
                                        containerPermissions: number,
                                        drawerMaxStats: ql.schema.ContainerDefStat_Single,
                                        drawerCurrentStats: DrawerCurrentStats,
                                        showToasts: boolean) {
  if (!dropContainerID) {
    return true;
  }
  // Dropping inside a container
  const dragContainerDrawers: ContainerDrawersFragment[] = dragDataTransfer.item.containerDrawers;

  // Go through container drawers to see if double nesting a container
  const doubleNestingContainer = dragContainerDrawers && dropContainerID.length > 1;

  const puttingInSelf = dragDataTransfer.item.id === dropContainerID[dropContainerID.length - 1];

  // Go through drawers to see if the drag container already contains containers in it
  const hasContainersAlready = _.find(dragContainerDrawers, drawer =>
    _.findIndex(drawer.containedItems, _item =>
      _item.containerDrawers && _item.containerDrawers.length > 0) !== -1);

  // TODO: allow equipped items to be moved into a container, for now dont. I'll make it a task -AJ
  const isAnEquippedItem = dragDataTransfer.gearSlots;

  // Does user have Container Permissions (Add, Remove, See)
  const userMeetsPermissions = !containerPermissions || containerPermissions & ItemPermissions.AddContents;

  // Check if drop item would exceed max Drawer Stats (maxItemCount, maxMass)
  const meetsUnitCountStat = drawerMaxStats.maxItemCount === -1 ||
    (!_.isEqual(dragDataTransfer.containerID, dropContainerID) ?
    (dropDataTransfer.item ? (drawerCurrentStats.totalUnitCount - dropDataTransfer.item.stats.item.unitCount +
      dragDataTransfer.item.stats.item.unitCount) <= drawerMaxStats.maxItemCount :
      drawerCurrentStats.totalUnitCount + dragDataTransfer.item.stats.item.unitCount <= drawerMaxStats.maxItemCount) : true);

  const meetsMassStat = drawerMaxStats.maxItemMass === -1 ||
    (!_.isEqual(dragDataTransfer.containerID, dropContainerID) ?
    (dropDataTransfer.item ? (drawerCurrentStats.weight - dropDataTransfer.item.stats.item.totalMass +
      dragDataTransfer.item.stats.item.totalMass) <= drawerMaxStats.maxItemMass :
      drawerCurrentStats.weight + dragDataTransfer.item.stats.item.totalMass <= drawerMaxStats.maxItemMass) : true);

  const canPutInContainer = !doubleNestingContainer && !puttingInSelf && !hasContainersAlready &&
    !isAnEquippedItem && userMeetsPermissions && meetsUnitCountStat && meetsMassStat;

  if (!canPutInContainer) {
    // Can NOT put in container
    if (showToasts) {
      if (isAnEquippedItem) {
        toastr.error('Try moving the equipped item to the inventory first', 'Try this', { timeout: 3000 });
      }

      if (doubleNestingContainer) {
        toastr.error('A container can only be nested one level', 'Darn!', { timeout: 3000 });
      }

      if (puttingInSelf) {
        toastr.error('You can\'t put a container inside of itself', 'Silly!', { timeout: 3000 });
      }

      if (!puttingInSelf && hasContainersAlready) {
        toastr.error(`${dragDataTransfer.item.givenName ||
          dragDataTransfer.item.staticDefinition.name} already contains a container inside.`, 'Darn!', { timeout: 3000 });
      }

      if (!meetsUnitCountStat) {
        toastr.error('You have reached the max amount of items in this drawer', 'You can\'t do that', { timeout: 3000 });
      }

      if (!meetsMassStat) {
        toastr.error('You have reached the max amount of mass in this drawer', 'You can\'t do that', { timeout: 3000 });
      }
    }

    return false;
  } else {
    return true;
  }
}
