import React from 'react';
import { AppBanner, BannerBadge, BannerButton } from './AppBanner';

export type SuccessBannerProps = {
  visible: boolean;
  title?: string;
  lessonTitle?: string;
  hskName?: string;
  itemCount?: number;
  details?: string;
  actionText?: string;
  autoCloseMs?: number;
  onClose: () => void;
  onAction?: () => void;
};

export const SuccessBanner: React.FC<SuccessBannerProps> = ({
  visible,
  title = 'Saved Successfully!',
  lessonTitle,
  hskName,
  itemCount,
  details,
  actionText = 'Done',
  autoCloseMs = 3500,
  onClose,
  onAction,
}) => {
  const badges: BannerBadge[] = [];

  if (hskName) {
    badges.push({
      label: hskName,
      icon: 'book-open',
      color: '#2563eb',
      bg: '#eff6ff',
      borderColor: '#bfdbfe',
    });
  }

  if (itemCount !== undefined && itemCount > 0) {
    badges.push({
      label: `${itemCount} ${itemCount === 1 ? 'item' : 'items'} included`,
      icon: 'layers',
      color: '#16a34a',
      bg: '#f0fdf4',
      borderColor: '#bbf7d0',
    });
  }

  const buttons: BannerButton[] = [];
  if (actionText) {
    buttons.push({
      text: actionText,
      onPress: () => {
        if (onAction) {
          onAction();
        } else {
          onClose();
        }
      },
      style: 'default',
    });
  }

  return (
    <AppBanner
      visible={visible}
      type="success"
      title={title}
      subTitle={lessonTitle}
      details={details}
      badges={badges.length > 0 ? badges : undefined}
      buttons={buttons.length > 0 ? buttons : undefined}
      autoCloseMs={autoCloseMs}
      onClose={onClose}
    />
  );
};
