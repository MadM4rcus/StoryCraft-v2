// src/components/ThemeEditor.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSystem } from '../context/SystemContext';
import { getThemesForUser, saveTheme, deleteTheme, applyThemeToCharacter } from '../services/themeService';
import ModalManager from './ModalManager'; // 1. IMPORTAÇÃO CORRIGIDA

const defaultTheme = {
  name: 'Novo Tema',
  ownerUid: '',
  isPublic: false,
  styles: {
    backgroundImage: "url('')",
    fontFamily: "'Roboto', sans-serif",
    surfaceOpacity: 80,
    colors: {
      bgPage: '#111827',
      bgSurface: '#1f2937',
      bgElement: '#374151',
      bgInput: '#4b5563',
      textPrimary: '#f9fafb',
      textSecondary: '#9ca3af',
      borderAccent: '#f59e0b',
      textAccent: '#fcd34d',
      btnHighlightBg: '#8b5cf6',
      btnHighlightText: '#ffffff',
    },
  },
};

const fontOptions = ["'Roboto', sans-serif", "'Merriweather', serif", "'Lato', sans-serif", "'Noto Sans', sans-serif", "'Slabo 27px', serif"];

const ThemeEditor = ({ character, setPreviewTheme, onClose }) => {
  const { user } = useAuth(); // Apenas o usuário do useAuth
  // Importar e usar useSystem para obter o contexto do sistema
  const { characterDataCollectionRoot } = useSystem(); 
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(defaultTheme);
  // 2. ESTADO DE MODAL ATUALIZADO
  const [modalState, setModalState] = useState({ type: null, props: {} });
  const closeModal = () => setModalState({ type: null, props: {} });

  useEffect(() => {
    if (user) {
      getThemesForUser(user.uid).then(setThemes);
      setSelectedTheme(prev => ({...defaultTheme, ownerUid: user.uid}));
    }
  }, [user]);

  useEffect(() => { setPreviewTheme(selectedTheme); }, [selectedTheme, setPreviewTheme]); 

  const handleThemeSelection = (themeId) => {
    if (themeId === 'new') setSelectedTheme({...defaultTheme, ownerUid: user.uid});
    else { const foundTheme = themes.find(t => t.id === themeId); if (foundTheme) setSelectedTheme(foundTheme); } 
  };

  const handleStyleChange = (key, value) => setSelectedTheme(prev => ({ ...prev, styles: { ...prev.styles, [key]: value } }));
  const handleColorChange = (key, value) => setSelectedTheme(prev => ({ ...prev, styles: { ...prev.styles, colors: { ...prev.styles.colors, [key]: value } } }));
  const handleNameChange = (e) => setSelectedTheme(prev => ({ ...prev, name: e.target.value }));

  // 3. FUNÇÕES ATUALIZADAS PARA USAR setModalState
  const handleSave = async () => {
    const themeToSave = { ...selectedTheme, ownerUid: user.uid };
    try {
      const savedId = await saveTheme(themeToSave);
      if (savedId) {
        setModalState({ type: 'info', props: { message: 'Tema salvo com sucesso!', onConfirm: closeModal } });
        const updatedThemes = await getThemesForUser(user.uid);
        setThemes(updatedThemes);
        const newlySavedTheme = updatedThemes.find(t => t.id === (themeToSave.id || savedId));
        if (newlySavedTheme) setSelectedTheme(newlySavedTheme);
      } else { throw new Error("Ocorreu um erro desconhecido ao salvar."); }
    } catch (error) {
      console.error("Falha ao salvar o tema:", error);
      setModalState({ type: 'info', props: { message: `Falha ao salvar o tema.`, onConfirm: closeModal } });
    }
  };

  const handleDelete = () => {
    if (!selectedTheme.id) {
        setModalState({ type: 'info', props: { message: 'Não pode apagar um tema que ainda não foi salvo.', onConfirm: closeModal } }); 
        return;
    }
    setModalState({
        type: 'confirm', 
        props: {
            message: `Tem a certeza que quer apagar o tema "${selectedTheme.name}"?`,
            onConfirm: async () => {
                await deleteTheme(selectedTheme.id);
                closeModal();
                getThemesForUser(user.uid).then(setThemes);
                handleThemeSelection('new');
            },
            onCancel: closeModal,
        }
    });
  };

  const handleApply = async () => {
    if (!character || !selectedTheme.id) {
      setModalState({ type: 'info', props: { message: 'Precisa ter uma ficha selecionada e um tema salvo para aplicar.', onConfirm: closeModal } });
      return;
    }
    await saveTheme(selectedTheme);
    await applyThemeToCharacter(character.ownerUid, character.id, selectedTheme.id, characterDataCollectionRoot); // Passa characterDataCollectionRoot
    setModalState({ type: 'info', props: { message: `Tema "${selectedTheme.name}" aplicado!`, onConfirm: () => { closeModal(); onClose(); } }});
  };

  return (
    <>
      {/* 4. RENDERIZAÇÃO ATUALIZADA */}
      <ModalManager modalState={modalState} closeModal={closeModal} />
      
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-bgSurface rounded-lg shadow-xl p-6 w-full max-w-3xl border border-bgElement max-h-[90vh] flex flex-col">
          <h2 className="text-2xl font-bold text-textAccent mb-4">Editor de Temas</h2>
          <div className="flex-grow overflow-y-auto pr-2">
            <div className="mb-4">
              <label className="block text-sm font-medium text-textSecondary mb-1">Tema a Editar</label>
              <select onChange={(e) => handleThemeSelection(e.target.value)} value={selectedTheme.id || 'new'} className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary">
                <option value="new">-- Criar Novo Tema --</option>
                {themes.map(theme => (<option key={theme.id} value={theme.id}>{theme.name}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-textSecondary mb-1">Nome do Tema</label><input type="text" value={selectedTheme.name} onChange={handleNameChange} className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary" /></div>
              <div><label className="block text-sm font-medium text-textSecondary mb-1">URL da Imagem de Fundo</label><input type="text" value={selectedTheme.styles.backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/, '$1')} onChange={(e) => handleStyleChange('backgroundImage', `url('${e.target.value}')`)} className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary" /></div>
              <div><label className="block text-sm font-medium text-textSecondary mb-1">Fonte Principal</label><select value={selectedTheme.styles.fontFamily} onChange={(e) => handleStyleChange('fontFamily', e.target.value)} className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary">{fontOptions.map(font => <option key={font} value={font}>{font.split(',')[0].replace(/'/g, '')}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-textSecondary mb-1">Transparência dos Módulos ({selectedTheme.styles.surfaceOpacity || 80}%)</label><input type="range" min="10" max="100" step="5" value={selectedTheme.styles.surfaceOpacity || 80} onChange={(e) => handleStyleChange('surfaceOpacity', parseInt(e.target.value))} className="w-full h-2 bg-bgElement rounded-lg appearance-none cursor-pointer mt-2"/></div>
            </div>
            <h3 className="text-lg font-semibold text-textAccent mt-6 mb-2">Cores</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(selectedTheme.styles.colors).map(([key, value]) => (<div key={key}><label className="block text-sm font-medium text-textSecondary capitalize">{key.replace(/([A-Z])/g, ' $1')}</label><div className="flex items-center gap-2 p-1 bg-bgInput border border-bgElement rounded-md"><input type="color" value={value} onChange={(e) => handleColorChange(key, e.target.value)} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" /><input type="text" value={value} onChange={(e) => handleColorChange(key, e.target.value)} className="w-full bg-transparent text-textPrimary text-sm" /></div></div>))}
            </div>
          </div>
          <div className="flex flex-wrap justify-between items-center mt-6 pt-4 border-t border-bgElement">
            <div><button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg mr-2">Salvar</button><button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg">Apagar</button></div>
            <div className="flex items-center gap-4"><button onClick={handleApply} disabled={!character || !selectedTheme.id} className="px-4 py-2 bg-btnHighlightBg text-btnHighlightText font-bold rounded-lg disabled:opacity-50">Aplicar</button><button onClick={onClose} className="px-4 py-2 bg-textSecondary/50 text-textPrimary font-bold rounded-lg">Fechar</button></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThemeEditor;