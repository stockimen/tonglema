import React, { useState } from 'react';
import { useSitesManager } from './useSitesManager';
import { SiteConfig, CategoryConfig, Language } from '../types';
import { X, Upload, Download, Settings, Globe, Folder, Plus, Trash2, Save, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface SitesSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const SitesSettingsModal: React.FC<SitesSettingsModalProps> = ({ isOpen, onClose, lang }) => {
  const {
    data,
    sites,
    categories,
    addCategory,
    editCategory,
    deleteCategory,
    addSite,
    editSite,
    deleteSite,
    resetToDefault,
    exportData,
    importData
  } = useSitesManager();

  const [activeTab, setActiveTab] = useState<'sites' | 'categories'>('sites');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSite, setShowAddSite] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingSite, setEditingSite] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set(categories.map(cat => cat.id)));

  const t = TRANSLATIONS[lang];

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return categoryId;
    return lang === 'zh' ? (category.name_zh || category.name) : category.name;
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importData(file);
    }
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-background rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text">{lang === 'zh' ? '网站设置' : 'Sites Settings'}</h2>
              <p className="text-sm text-muted">{lang === 'zh' ? '管理您的网站和分类' : 'Manage your sites and categories'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-surface border border-border text-text hover:bg-muted/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('sites')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'sites'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted hover:text-text'
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {lang === 'zh' ? '网站' : 'Sites'} ({sites.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'categories'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted hover:text-text'
            }`}
          >
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              {lang === 'zh' ? '分类' : 'Categories'} ({categories.length})
            </div>
          </button>
        </div>

        {/* Add Site Form - Top Section */}
        {activeTab === 'sites' && (
          <div className="p-4 border-b border-border bg-surface/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowAddSite(!showAddSite)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {lang === 'zh' ? '添加网站' : 'Add Site'}
                </button>

                <label className="px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-muted/10 cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileImport}
                  />
                  {lang === 'zh' ? '导入' : 'Import'}
                </label>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={exportData}
                  className="px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-muted/10 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {lang === 'zh' ? '导出' : 'Export'}
                </button>
                <button
                  onClick={resetToDefault}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  {lang === 'zh' ? '重置' : 'Reset'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 ">
          {/* Add Site Form */}
          {showAddSite && (
            <div className=" p-4 border border-border rounded-lg bg-surface/50 mb-4">
              <h3 className="font-medium text-text mb-4">{lang === 'zh' ? '添加新网站' : 'Add New Site'}</h3>
              <SiteEditor
                site={null}
                categories={categories}
                lang={lang}
                onSave={(newSite) => {
                  addSite({
                    name: newSite.name,
                    name_zh: newSite.name_zh,
                    url: newSite.url,
                    category: newSite.category,
                    description: newSite.description,
                    description_zh: newSite.description_zh,
                    iconUrl: newSite.iconUrl
                  });
                  setShowAddSite(false);
                }}
                onCancel={() => setShowAddSite(false)}
              />
            </div>
          )}

          {activeTab === 'sites' && (
            <div>
              {/* Sites List */}
              <div className="grid gap-4">
                {Object.entries(
                  sites.reduce<Record<string, SiteConfig[]>>((acc, site) => {
                    if (!acc[site.category]) acc[site.category] = [];
                    acc[site.category].push(site);
                    return acc;
                  }, {})
                ).map(([categoryId, categorySites]) => (
                  <div key={categoryId} className="border border-border rounded-lg">
                    <div className="px-4 py-2 bg-surface border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted/10 transition-colors"
                         onClick={() => toggleCategory(categoryId)}>
                      <span className="font-medium text-text flex items-center gap-2">
                        {getCategoryName(categoryId)}
                        {collapsedCategories.has(categoryId) ? (
                          <ChevronDown className="w-4 h-4 text-muted" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-muted" />
                        )}
                      </span>
                    </div>
                    <div className={`divide-y divide-border transition-all duration-200 ${
                      collapsedCategories.has(categoryId) ? 'max-h-0 overflow-hidden' : 'max-h-[calc(90vh-300px)] overflow-y-auto'
                    }`}>
                      {categorySites.map(site => (
                        <div key={site.id} className="p-4 flex items-start justify-between hover:bg-muted/5 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="text-lg font-medium text-text">{lang === 'zh' ? (site.name_zh || site.name) : site.name}</div>
                            </div>
                            <div className="text-xs text-muted flex items-center gap-2">
                              <span>{site.url}</span>
                              <span className="px-2 py-0.5 bg-surface border border-border rounded">
                                {getCategoryName(site.category)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => setEditingSite(site.id)}
                              className="p-2 text-muted hover:text-text rounded-lg hover:bg-muted/10"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteSite(site.id)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setShowAddCategory(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {lang === 'zh' ? '添加分类' : 'Add Category'}
                </button>
              </div>

              {/* Add Category Form */}
              {showAddCategory && (
                  <div className="mt-6 p-4 border border-border rounded-lg bg-surface/50">
                    <h3 className="font-medium text-text mb-4">{lang === 'zh' ? '添加新分类' : 'Add New Category'}</h3>
                    <CategoryEditor
                        category={null}
                        lang={lang}
                        onSave={(newCategory) => {
                          addCategory({
                            name: newCategory.name,
                            name_zh: newCategory.name_zh,
                            color: newCategory.color
                          });
                          setShowAddCategory(false);
                        }}
                        onCancel={() => setShowAddCategory(false)}
                    />
                  </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(category => (
                  <div key={category.id} className="border border-border rounded-lg p-4">
                    {editingCategory === category.id ? (
                      <CategoryEditor
                        category={category}
                        lang={lang}
                        onSave={(updated) => {
                          editCategory(category.id, updated);
                          setEditingCategory(null);
                        }}
                        onCancel={() => setEditingCategory(null)}
                        onDelete={() => {
                          deleteCategory(category.id);
                          setEditingCategory(null);
                        }}
                      />
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${category.color || 'bg-gray-500'}`}></div>
                            <div>
                              <div className="font-medium text-text">
                                {lang === 'zh' ? (category.name_zh || category.name) : category.name}
                              </div>
                              <div className="text-xs text-muted">ID: {category.id}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingCategory(category.id)}
                            className="p-1 text-muted hover:text-text rounded hover:bg-muted/10"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs text-muted">
                          {lang === 'zh'
                            ? `${sites.filter(site => site.category === category.id).length} 个网站`
                            : `${sites.filter(site => site.category === category.id).length} sites`}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>


            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 网站编辑器组件
 */
interface SiteEditorProps {
  site: SiteConfig | null;
  categories: CategoryConfig[];
  lang: Language;
  onSave: (data: Partial<SiteConfig>) => void;
  onCancel: () => void;
}

const SiteEditor: React.FC<SiteEditorProps> = ({ site, categories, lang, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: site?.name || '',
    name_zh: site?.name_zh || '',
    url: site?.url || '',
    category: site?.category || categories[0]?.id || '',
    description: site?.description || '',
    description_zh: site?.description_zh || '',
    iconUrl: site?.iconUrl || ''
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {lang === 'zh' ? '英文名称' : 'Name (EN)'} *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder={lang === 'zh' ? '输入英文名称' : 'Enter name'}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">{lang === 'zh' ? '中文名称' : 'Name (ZH)'}</label>
          <input
            type="text"
            value={formData.name_zh}
            onChange={e => setFormData({ ...formData, name_zh: e.target.value })}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder={lang === 'zh' ? '输入中文名称（可选）' : 'Enter Chinese name (optional)'}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text mb-1">
          URL *
        </label>
        <input
          type="url"
          value={formData.url}
          onChange={e => setFormData({ ...formData, url: e.target.value })}
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder={lang === 'zh' ? 'https://example.com' : 'https://example.com'}
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">{lang === 'zh' ? '分类' : 'Category'} *</label>
          <select
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {lang === 'zh' ? (cat.name_zh || cat.name) : cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">{lang === 'zh' ? '图标URL' : 'Icon URL'}</label>
          <input
            type="url"
            value={formData.iconUrl}
            onChange={e => setFormData({ ...formData, iconUrl: e.target.value })}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder={lang === 'zh' ? 'https://example.com/favicon.ico' : 'https://example.com/favicon.ico'}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text mb-1">{lang === 'zh' ? '英文描述' : 'Description (EN)'}</label>
        <input
          type="text"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder={lang === 'zh' ? '输入英文描述（可选）' : 'Enter description (optional)'}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text mb-1">{lang === 'zh' ? '中文描述' : 'Description (ZH)'}</label>
        <input
          type="text"
          value={formData.description_zh}
          onChange={e => setFormData({ ...formData, description_zh: e.target.value })}
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder={lang === 'zh' ? '输入中文描述（可选）' : 'Enter Chinese description (optional)'}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-muted/10"
        >
          {lang === 'zh' ? '取消' : 'Cancel'}
        </button>
        <button
          onClick={() => onSave(formData)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {lang === 'zh' ? '保存' : 'Save'}
        </button>
      </div>
    </div>
  );
};

/**
 * 分类编辑器组件
 */
interface CategoryEditorProps {
  category: CategoryConfig | null;
  lang: Language;
  onSave: (data: Partial<CategoryConfig>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const CategoryEditor: React.FC<CategoryEditorProps> = ({ category, lang, onSave, onCancel, onDelete }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    name_zh: category?.name_zh || '',
    color: category?.color || 'bg-blue-500'
  });

  const COLOR_OPTIONS = [
    'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-500',
    'bg-blue-500', 'bg-cyan-500', 'bg-teal-500', 'bg-green-500',
    'bg-yellow-500', 'bg-orange-500', 'bg-gray-500', 'bg-black'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text mb-1">{lang === 'zh' ? '英文名' : 'Name (EN)'}</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder={lang === 'zh' ? '输入英文名' : 'Enter name'}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text mb-1">{lang === 'zh' ? '中文名' : 'Name (ZH)'}</label>
        <input
          type="text"
          value={formData.name_zh}
          onChange={e => setFormData({ ...formData, name_zh: e.target.value })}
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder={lang === 'zh' ? '输入中文名' : 'Enter Chinese name'}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text mb-1">{lang === 'zh' ? '颜色' : 'Color'}</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map(color => (
            <button
              key={color}
              onClick={() => setFormData({ ...formData, color })}
              className={`w-8 h-8 rounded-full ${color} ${
                formData.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''
              }`}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between">
        <div>
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              {lang === 'zh' ? '删除' : 'Delete'}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-muted/10"
          >
            {lang === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            {lang === 'zh' ? '保存' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};