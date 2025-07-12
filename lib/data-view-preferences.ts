/**
 * Cookie工具函数
 * 用于保存和恢复用户的查看偏好
 */

export interface DataViewPreferences {
  selectedDevice?: string;
  activeTab?: string;
  lastVisit?: number;
}

const COOKIE_NAME = 'onenet_data_prefs';
const COOKIE_EXPIRY_DAYS = 30; // 30天过期

/**
 * 设置Cookie
 */
export function setDataViewPreferences(prefs: DataViewPreferences): void {
  try {
    const preferences = {
      ...prefs,
      lastVisit: Date.now()
    };
    
    const expires = new Date();
    expires.setDate(expires.getDate() + COOKIE_EXPIRY_DAYS);
    
    const cookieValue = encodeURIComponent(JSON.stringify(preferences));
    document.cookie = `${COOKIE_NAME}=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    
    console.debug('保存数据查看偏好:', preferences);
  } catch (error) {
    console.warn('保存偏好设置失败:', error);
  }
}

/**
 * 获取Cookie
 */
export function getDataViewPreferences(): DataViewPreferences | null {
  try {
    if (typeof document === 'undefined') return null; // 服务端渲染时返回null
    
    const cookies = document.cookie.split(';');
    const targetCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${COOKIE_NAME}=`)
    );
    
    if (!targetCookie) return null;
    
    const cookieValue = targetCookie.split('=')[1];
    const preferences = JSON.parse(decodeURIComponent(cookieValue)) as DataViewPreferences;
    
    // 检查是否过期（超过30天）
    if (preferences.lastVisit && Date.now() - preferences.lastVisit > COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
      clearDataViewPreferences();
      return null;
    }
    
    console.debug('恢复数据查看偏好:', preferences);
    return preferences;
  } catch (error) {
    console.warn('读取偏好设置失败:', error);
    return null;
  }
}

/**
 * 清除Cookie
 */
export function clearDataViewPreferences(): void {
  try {
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    console.debug('清除数据查看偏好');
  } catch (error) {
    console.warn('清除偏好设置失败:', error);
  }
}

/**
 * 更新单个偏好项
 */
export function updateDataViewPreference(key: keyof DataViewPreferences, value: string): void {
  const currentPrefs = getDataViewPreferences() || {};
  setDataViewPreferences({
    ...currentPrefs,
    [key]: value
  });
}

/**
 * React Hook: 使用数据查看偏好
 */
export function useDataViewPreferences() {
  const savePreferences = (prefs: Partial<DataViewPreferences>) => {
    const currentPrefs = getDataViewPreferences() || {};
    setDataViewPreferences({
      ...currentPrefs,
      ...prefs
    });
  };

  const loadPreferences = (): DataViewPreferences | null => {
    return getDataViewPreferences();
  };

  const clearPreferences = () => {
    clearDataViewPreferences();
  };

  return {
    savePreferences,
    loadPreferences,
    clearPreferences
  };
}
