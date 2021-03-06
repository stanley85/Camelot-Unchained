import * as React from 'react';
import * as _ from 'lodash';
import { ql, events } from '@csegames/camelot-unchained';

import styled, { css } from 'react-emotion';
import eventNames, { EquipItemCallback } from '../../../lib/eventNames';
import { defaultSlotIcons, placeholderIcon } from '../../../lib/constants';
import { getInventoryDataTransfer } from '../../../lib/utils';
import { InventoryDataTransfer } from '../../Inventory/components/InventoryBase';
import withDragAndDrop, { DragAndDropInjectedProps, DragEvent } from '../../../../../components/DragAndDrop/DragAndDrop';
import { InventoryItemFragment, EquippedItemFragment } from '../../../../../gqlInterfaces';

declare const toastr: any;

const Container = styled('div')`
  position: relative;
  overflow: hidden;
  width: 70px;
  height: 70px;
  opacity: ${(props: any) => props.opacity};
`;

const ItemIcon = styled('img')`
  overflow: hidden;
  width: 69px;
  height: 70px;
`;

const SlotOverlay = styled('div')`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: ${(props: any) => props.backgroundColor};
  box-shadow: ${(props: any) => props.boxShadow};
`;

const defaultIconStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.3;
  width: 100%;
  height: 100%;
`;

export interface DraggableEquippedItemProps extends DragAndDropInjectedProps {
  slotName: string;
  equippedItem: EquippedItemFragment;
}

export interface DraggableEquippedItemState {
  opacity: number;
  backgroundColor: string;
  highlightSlot: boolean;
}

const colors = {
  canEquip: 'rgba(46, 213, 80, 0.4)',
  cannotEquip: 'rgba(186, 50, 50, 0.4)',
};

class EquippedItemComponent extends React.Component<DraggableEquippedItemProps, DraggableEquippedItemState> {
  private onHighlightListener: EventListener;
  private onDehighlightListener: EventListener;

  constructor(props: DraggableEquippedItemProps) {
    super(props);
    this.state = {
      opacity: 1,
      backgroundColor: 'transparent',
      highlightSlot: false,
    };
  }

  public data() {
    const equippedItem = this.props.equippedItem;
    return getInventoryDataTransfer({
      item: equippedItem.item,
      location: 'equipped',
      position: -1,
      gearSlots: equippedItem.gearSlots,
    });
  }

  public onDragStart() {
    this.setState({ opacity: 0.3 });
  }

  public onDrop(e: DragEvent<InventoryDataTransfer, DraggableEquippedItemProps>) {
    const item = e.dataTransfer.item;
    if (item.location.inventory) {
      item.location.inventory = null;
      this.equipItem(item, this.props.equippedItem);
    } else {
      toastr.error('Move item out of container, then try to equip it.', 'Try this', { timeout: 2000 });
    }
  }

  public onDragOver(e: DragEvent<InventoryDataTransfer, DraggableEquippedItemProps>) {
    if (this.state.backgroundColor === 'transparent') {
      if (this.canEquip(e.dataTransfer.item as any)) {
        this.setState({ backgroundColor: colors.canEquip });
      } else {
        this.setState({ backgroundColor: colors.cannotEquip });
      }
    }
  }

  public onDragLeave() {
    this.setState({ backgroundColor: 'transparent' });
  }

  public onDragEnd() {
    this.setState({ opacity: 1 });
  }

  public render() {
    const { equippedItem, slotName } = this.props;
    const iconUrl = equippedItem && equippedItem.item.staticDefinition.iconUrl ||
      `${defaultSlotIcons[slotName]} \ ${defaultIconStyle}`;
    const isRightSlot = _.includes(slotName.toLowerCase(), 'right');
    const flipIcon = isRightSlot ? { transform: 'scaleX(-1)', WebkitTransform: 'scaleX(-1)' } : {};
    return (
      <Container opacity={this.state.opacity}>
        {this.props.equippedItem ? <ItemIcon style={flipIcon} src={iconUrl || placeholderIcon} /> :
          <div style={flipIcon} className={`${iconUrl}`} />}
        <SlotOverlay
          backgroundColor={this.state.backgroundColor}
          boxShadow={this.state.highlightSlot ? 'inset 0 0 15px 5px yellow' : 'none'}
        />
      </Container>
    );
  }

  public componentDidMount() {
    this.onHighlightListener = events.on(eventNames.onHighlightSlots, this.onHighlightSlots);
    this.onDehighlightListener = events.on(eventNames.onDehighlightSlots, this.onDehighlightSlots);
  }

  public componentWillUnmount() {
    events.off(this.onHighlightListener);
    events.off(this.onDehighlightListener);
  }

  private onHighlightSlots = (gearSlots: ql.schema.GearSlotDefRef[]) => {
    if (_.find(gearSlots, (gearSlot: ql.schema.GearSlotDefRef) => this.props.slotName === gearSlot.id)) {
      this.setState({ highlightSlot: true });
    }
  }

  private onDehighlightSlots = () => {
    if (this.state.highlightSlot) this.setState({ highlightSlot: false });
  }

  private canEquip = (dragItem: InventoryItemFragment) => {
    if (dragItem && dragItem.staticDefinition && !dragItem.location.inContainer) {
      const gearSlotSets = dragItem.staticDefinition.gearSlotSets;
      let canEquip = false;
      gearSlotSets.forEach((set) => {
        if (canEquip) return;
        if (_.find(set.gearSlots, slot => slot.id === this.props.slotName)) {
          canEquip = true;
          return;
        }
      });

      return canEquip;
    }
  }

  private equipItem = (inventoryItem: InventoryItemFragment, equippedItem: EquippedItemFragment) => {
    const gearSlotSet = _.find(inventoryItem.staticDefinition.gearSlotSets, (set) => {
      return _.findIndex(set.gearSlots, (slot) => {
        return _.lowerCase(slot.id) === _.lowerCase(this.props.slotName);
      }) !== -1;
    });

    const willEquipTo = gearSlotSet && gearSlotSet.gearSlots;

    const payload: EquipItemCallback = {
      inventoryItem,
      prevEquippedItem: equippedItem,
      willEquipTo,
    };

    if (willEquipTo) {
      events.fire(eventNames.onEquipItem, payload);
    }
  }
}

const DraggableEquippedItem = withDragAndDrop<DraggableEquippedItemProps>(
  (props: DraggableEquippedItemProps) => ({
    id: props.equippedItem && props.equippedItem.item.id,
    dataKey: 'inventory-items',
    scrollBodyId: 'inventory-scroll-container',
    dropTarget: true,
    disableDrag: !props.equippedItem,
  }),
)(EquippedItemComponent);

export default DraggableEquippedItem;
