// EmotionTheories.js
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';  // Import Bootstrap CSS
import './EmotionTheories.css';  // Import custom CSS

const EmotionTheories = () => {
  const theories = [
    {
      title: "Evolutionary Theory of Emotion",
      content: "This theory suggests that emotions have an evolutionary origin. Naturalist Charles Darwin proposed that emotions evolved because they were adaptive and allowed humans and animals to survive and reproduce. Emotions motivate people to respond quickly to stimuli in the environment, which helps improve the chances of success and survival."
    },
    {
      title: "James-Lange Theory of Emotion",
      content: "This theory suggests that emotions occur as a result of physiological reactions to events. Your emotional reaction depends upon how you interpret those physical reactions. For example, if you are trembling and your heart races when encountering danger, you conclude that you are frightened."
    },
    {
      title: "Cannon-Bard Theory of Emotion",
      content: "This theory proposes that emotions result when the thalamus sends a message to the brain in response to a stimulus, resulting in a simultaneous emotional experience and physiological reaction."
    },
    {
      title: "Schachter-Singer Theory of Emotion",
      content: "This theory suggests that physiological arousal occurs first, and then the individual must identify the reason for this arousal to experience and label it as an emotion."
    },
    {
      title: "Cognitive Appraisal Theory of Emotion",
      content: "According to this theory, thinking must occur first before experiencing emotion. Your brain first appraises a situation, leading to the emotional response."
    },
    {
      title: "Facial-Feedback Theory of Emotion",
      content: "This theory suggests that facial expressions are directly tied to emotions. Smiling or frowning can influence how we feel about a situation."
    }
  ];

  return (
    <div className="emotion-theories-container">
      <div className="theory-header-container">
        {/* Emotion Theory Section */}
        <div className="emotion-section">
          <h2 className="emotion-title">The Theory of Emotions</h2>
          <p className="emotion-text">
            Emotions are psychological states that involve physiological changes, behavioral responses, and conscious feelings.
            They are an integral part of human experience and can be categorized into basic emotions such as happiness, sadness, anger, fear, surprise, and disgust.
          </p>
          <div className="emotion-types">
            <div className="emotion-type happy">Happiness</div>
            <div className="emotion-type exciting">Excited</div>
            <div className="emotion-type sad">Sadness</div>
            <div className="emotion-type angry">Anger</div>
            <div className="emotion-type frustration">Frustration</div>
            <div className="emotion-type neutral">Neutral</div>
          </div>
        </div>
      </div>
      <h2 className="emotion-theories-title">The 6 Major Theories of Emotion</h2>
      <div className="accordion" id="emotionAccordion">
        {theories.map((theory, index) => (
          <div className="accordion-item" key={index}>
            <h2 className="accordion-header" id={`heading${index}`}>
              <button
                className="accordion-button"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target={`#collapse${index}`}
                aria-expanded="true"
                aria-controls={`collapse${index}`}
              >
                {theory.title}
              </button>
            </h2>
            <div
              id={`collapse${index}`}
              className="accordion-collapse collapse"
              aria-labelledby={`heading${index}`}
              data-bs-parent="#emotionAccordion"
            >
              <div className="accordion-body">
                {theory.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmotionTheories;
