import React, { useState, useEffect } from 'react';
import axios from 'axios';

function GerenciarDepoimentos() {
  const [depoimentos, setDepoimentos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    cidade: '',
    texto: '',
    ativo: 1,
    ordem: 0
  });

  const token = localStorage.getItem('token');

  // Carregar depoimentos
  const carregarDepoimentos = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/depoimentos/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepoimentos(response.data);
    } catch (error) {
      console.error('Erro ao carregar depoimentos:', error);
    }
  };

  useEffect(() => {
    carregarDepoimentos();
  }, []);

  // Salvar (criar ou editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editando) {
        await axios.put(`http://localhost:5000/api/admin/depoimentos/${editando}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Depoimento atualizado!');
      } else {
        await axios.post('http://localhost:5000/api/admin/depoimentos', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Depoimento adicionado!');
      }
      
      setFormData({ nome: '', cidade: '', texto: '', ativo: 1, ordem: 0 });
      setEditando(null);
      carregarDepoimentos();
    } catch (error) {
      alert('Erro ao salvar depoimento');
      console.error(error);
    }
  };

  // Editar
  const handleEdit = (depoimento) => {
    setEditando(depoimento.id);
    setFormData({
      nome: depoimento.nome,
      cidade: depoimento.cidade || '',
      texto: depoimento.texto,
      ativo: depoimento.ativo,
      ordem: depoimento.ordem
    });
  };

  // Remover
  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este depoimento?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/admin/depoimentos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Depoimento removido!');
      carregarDepoimentos();
    } catch (error) {
      alert('Erro ao remover depoimento');
    }
  };

  // Alternar ativo/inativo
  const toggleAtivo = async (depoimento) => {
    const novoAtivo = depoimento.ativo === 1 ? 0 : 1;
    
    try {
      await axios.put(`http://localhost:5000/api/admin/depoimentos/${depoimento.id}`, 
        { ...depoimento, ativo: novoAtivo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      carregarDepoimentos();
    } catch (error) {
      alert('Erro ao alterar status');
    }
  };

  return (
    <div className="gerenciar-depoimentos">
      <h2>📝 Gerenciar Depoimentos</h2>
      
      {/* Formulário */}
      <form onSubmit={handleSubmit} className="admin-form">
        <h3>{editando ? 'Editar Depoimento' : 'Novo Depoimento'}</h3>
        
        <input
          type="text"
          placeholder="Nome da cliente"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          required
        />
        
        <input
          type="text"
          placeholder="Cidade (ex: SP, RJ, MG)"
          value={formData.cidade}
          onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
        />
        
        <textarea
          placeholder="Depoimento"
          value={formData.texto}
          onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
          rows="4"
          required
        />
        
        <input
          type="number"
          placeholder="Ordem de exibição (1, 2, 3...)"
          value={formData.ordem}
          onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) })}
        />
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.ativo === 1}
            onChange={(e) => setFormData({ ...formData, ativo: e.target.checked ? 1 : 0 })}
          />
          Ativo (aparece na página)
        </label>
        
        <div className="form-buttons">
          <button type="submit" className="btn-save">
            {editando ? 'Atualizar' : 'Adicionar'}
          </button>
          {editando && (
            <button type="button" className="btn-cancel" onClick={() => {
              setEditando(null);
              setFormData({ nome: '', cidade: '', texto: '', ativo: 1, ordem: 0 });
            }}>
              Cancelar
            </button>
          )}
        </div>
      </form>
      
      {/* Lista de depoimentos */}
      <div className="depoimentos-list">
        <h3>Depoimentos Cadastrados</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ordem</th>
              <th>Nome</th>
              <th>Cidade</th>
              <th>Depoimento</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {depoimentos.map((depoimento) => (
              <tr key={depoimento.id}>
                <td>{depoimento.ordem}</td>
                <td>{depoimento.nome}</td>
                <td>{depoimento.cidade}</td>
                <td className="depoimento-texto">{depoimento.texto.substring(0, 50)}...</td>
                <td>
                  <button 
                    className={`status-badge ${depoimento.ativo === 1 ? 'active' : 'inactive'}`}
                    onClick={() => toggleAtivo(depoimento)}
                  >
                    {depoimento.ativo === 1 ? '✅ Ativo' : '❌ Inativo'}
                  </button>
                </td>
                <td className="actions">
                  <button onClick={() => handleEdit(depoimento)} className="btn-edit">✏️</button>
                  <button onClick={() => handleDelete(depoimento.id)} className="btn-delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GerenciarDepoimentos;