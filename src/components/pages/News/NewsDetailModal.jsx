import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import './NewsDetailModal.css';

const NewsDetailModal = ({ show, onHide, news }) => {
  if (!news) return null;

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg" 
      centered
      className="news-detail-modal"
    >
      <Modal.Header closeButton className="news-modal-header">
        <div className="news-modal-title">
          <span className="news-category-badge">{news.category}</span>
          <h4 className="news-modal-headline">{news.title}</h4>
        </div>
      </Modal.Header>
      
      <Modal.Body className="news-modal-body">
        <div className="news-meta">
          <span className="news-time">⏰ {news.time}</span>
          <span className="news-source">📰 운동 건강 뉴스</span>
        </div>
        
        <div className="news-content">
          <div className="news-image">
            <div className="news-image-placeholder">
              <span className="news-image-icon">💪</span>
            </div>
          </div>
          
          <div className="news-text">
            <p className="news-summary">
              {news.summary}
            </p>
            
            <div className="news-details">
              <h5>주요 내용</h5>
              <ul>
                {news.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            </div>
            
            <div className="news-tips">
              <h5>💡 실천 팁</h5>
              <p>{news.tips}</p>
            </div>
          </div>
        </div>
      </Modal.Body>
      
      <Modal.Footer className="news-modal-footer">
        <Button variant="outline-secondary" onClick={onHide}>
          닫기
        </Button>
        <Button variant="primary" onClick={onHide}>
          더 많은 뉴스 보기
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NewsDetailModal;

