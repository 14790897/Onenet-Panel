/**
 * 分析页面偏好设置工具
 */

export interface AnalyticsPreferences {
  selectedDevices?: string[];
  selectedDatastream?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  autoRefresh?: boolean;
  refreshInterval?: number;
  lastVisit?: number;
}

const ANALYTICS_COOKIE_NAME = 'onenet_analytics_prefs';
const COOKIE_EXPIRY_DAYS = 30;

/**
 * 设置分析页面偏好
 */
export function setAnalyticsPreferences(prefs: AnalyticsPreferences): void {
  try {
    const preferences = {
      ...prefs,
      lastVisit: Date.now()
    };
    
    const expires = new Date();
    expires.setDate(expires.getDate() + COOKIE_EXPIRY_DAYS);
    
    const cookieValue = encodeURIComponent(JSON.stringify(preferences));
    document.cookie = `${ANALYTICS_COOKIE_NAME}=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    
    console.debug('保存分析偏好:', preferences);
  } catch (error) {
    console.warn('保存分析偏好失败:', error);
  }
}

/**
 * 获取分析页面偏好
 */
export function getAnalyticsPreferences(): AnalyticsPreferences | null {
  try {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    const targetCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${ANALYTICS_COOKIE_NAME}=`)
    );
    
    if (!targetCookie) return null;
    
    const cookieValue = targetCookie.split('=')[1];
    const preferences = JSON.parse(decodeURIComponent(cookieValue)) as AnalyticsPreferences;
    
    // 检查是否过期
    if (preferences.lastVisit && Date.now() - preferences.lastVisit > COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
      clearAnalyticsPreferences();
      return null;
    }
    
    console.debug('恢复分析偏好:', preferences);
    return preferences;
  } catch (error) {
    console.warn('读取分析偏好失败:', error);
    return null;
  }
}

/**
 * 清除分析页面偏好
 */
export function clearAnalyticsPreferences(): void {
  try {
    document.cookie = `${ANALYTICS_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    console.debug('清除分析偏好');
  } catch (error) {
    console.warn('清除分析偏好失败:', error);
  }
}

/**
 * React Hook: 使用分析偏好
 */
export function useAnalyticsPreferences() {
  const savePreferences = (prefs: Partial<AnalyticsPreferences>) => {
    const currentPrefs = getAnalyticsPreferences() || {};
    setAnalyticsPreferences({
      ...currentPrefs,
      ...prefs
    });
  };

  const loadPreferences = (): AnalyticsPreferences | null => {
    return getAnalyticsPreferences();
  };

  const clearPreferences = () => {
    clearAnalyticsPreferences();
  };

  return {
    savePreferences,
    loadPreferences,
    clearPreferences
  };
}
