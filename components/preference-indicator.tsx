/**
 * 通用偏好设置提示组件
 */

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Check, X } from 'lucide-react';

interface PreferenceIndicatorProps {
  hasPreferences: boolean;
  onReset?: () => void;
  className?: string;
}

export function PreferenceIndicator({ 
  hasPreferences, 
  onReset, 
  className = "" 
}: PreferenceIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (hasPreferences) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasPreferences]);

  if (!hasPreferences) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant={showSaved ? "default" : "secondary"} 
        className={`text-xs transition-colors duration-300 ${
          showSaved ? 'bg-green-600' : ''
        }`}
      >
        {showSaved ? (
          <>
            <Check className="w-3 h-3 mr-1" />
            偏好已保存
          </>
        ) : (
          <>
            <Settings className="w-3 h-3 mr-1" />
            偏好已恢复
          </>
        )}
      </Badge>
      
      {onReset && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onReset}
          className="text-xs h-6 px-2"
          title="清除偏好设置"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

/**
 * Hook: 偏好设置状态管理
 */
export function usePreferenceState() {
  const [hasPreferences, setHasPreferences] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const markSaved = () => {
    setJustSaved(true);
    setHasPreferences(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const markLoaded = () => {
    setHasPreferences(true);
  };

  const markCleared = () => {
    setHasPreferences(false);
    setJustSaved(false);
  };

  return {
    hasPreferences,
    justSaved,
    markSaved,
    markLoaded,
    markCleared
  };
}
