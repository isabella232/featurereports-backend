import React, { Component } from 'react';
import ReportModelApiService from '../services/report-model.service';
import axios from 'axios';
import { getErrorMessage } from '../http-common';
import { FaMinus } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';

const defaultReportModel = {
  id: null,
  name: '',
  layer_id: '',
  custom_fields: [],
  created_at: '',
  created_by: '',
  updated_at: '',
  updated_by: '',
};

const defaultFormWarnings = {
  name: '',
  layer: '',
  fields: '',
  fieldName: {},
  fieldType: {},
};

const defaultCustomField = {
  name: '',
  type: '',
  required: false,
};

export default class ReportModel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentReportModel: defaultReportModel,
      formWarnings: defaultFormWarnings,
      errorMessage: '',
    };

    this.source = axios.CancelToken.source();
  }

  componentDidMount() {
    if (this.props.currentReportModel.id !== null) {
      this.getReportModel(this.props.currentReportModel.id);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentReportModel.id !== this.props.currentReportModel.id) {
      this.getReportModel(this.props.currentReportModel.id);
    }
  }

  componentWillUnmount() {
    if (this.source) {
      this.source.cancel('Component got unmounted');
    }
  }

  onChangeName(e) {
    const name = e.target.value;

    this.setState((prevState) => {
      return {
        currentReportModel: {
          ...prevState.currentReportModel,
          name: name,
        },
        formWarnings: {
          ...prevState.formWarnings,
          name: name ? '' : prevState.formWarnings.name,
        },
      };
    });
  }

  onChangeLayer(e) {
    const layer_id = e.target.value;

    this.setState((prevState) => ({
      currentReportModel: {
        ...prevState.currentReportModel,
        layer_id: layer_id,
      },
      formWarnings: {
        ...prevState.formWarnings,
        layer: layer_id ? '' : prevState.formWarnings.layer,
      },
    }));
  }

  onChangeField(edit, index, e) {
    this.setState((prevState) => ({
      currentReportModel: {
        ...prevState.currentReportModel,
        custom_fields: prevState.currentReportModel.custom_fields.map(
          (field, id) => {
            const returnField = { ...field };
            if (id === index) {
              switch (edit) {
                case 'name':
                  returnField.name = e.target.value;
                  break;
                case 'type':
                  returnField.type = e.target.value;
                  break;
                case 'required':
                  returnField.required = e.target.checked;
                  break;
                default:
              }
            }
            return returnField;
          }
        ),
      },
      formWarnings: {
        ...prevState.formWarnings,
        fieldName: Object.values(prevState.formWarnings.fieldName).map(
          (value, id) => {
            return edit === 'name' && e.target.value && id === index
              ? ''
              : value;
          }
        ),
        fieldType: Object.values(prevState.formWarnings.fieldType).map(
          (value, id) => {
            return edit === 'type' && e.target.value && id === index
              ? ''
              : value;
          }
        ),
      },
    }));
  }

  addField(e) {
    e.preventDefault();
    const custom_fields = this.state.currentReportModel
      .custom_fields;
    custom_fields.push(defaultCustomField);
    this.setState((prevState) => ({
      currentReportModel: {
        ...prevState.currentReportModel,
        custom_fields,
      },
      formWarnings: {
        ...prevState.formWarnings,
        fields:
          prevState.currentReportModel.custom_fields.length > 0
            ? ''
            : prevState.formWarnings.fields,
      },
    }));
  }

  deleteField(index, e) {
    e.preventDefault();
    this.setState((prevState) => ({
      currentReportModel: {
        ...prevState.currentReportModel,
        custom_fields: prevState.currentReportModel.custom_fields.filter(
          (field, id) => {
            return id !== index;
          }
        ),
      },
    }));
  }

  getReportModel(id) {
    ReportModelApiService.get(id, this.source.token)
      .then((response) => {
        this.setState({
          currentReportModel: response.data,
        });
      })
      .catch((e) => {
        this.setState({
          errorMessage: getErrorMessage(e),
        });
      });
  }

  submitReportModel() {
    if (this.validateReportModel()) {
      if (this.props.currentReportModel.id !== null) {
        this.updateReportModel();
      } else {
        this.createReportModel();
      }
    }
  }

  createReportModel() {
    var data = {
      name: this.state.currentReportModel.name,
      layer_id: this.state.currentReportModel.layer_id,
      custom_fields: this.state.currentReportModel.custom_fields,
    };

    ReportModelApiService.create(data, this.source.token)
      .then((response) => {
        this.setState({
          id: response.data.id,
          name: response.data.name,
          layer_id: response.data.layer_id,
          custom_fields: response.data.custom_fields,
        });
        this.props.onReportModelChange();
      })
      .catch((e) => {
        this.setState({
          errorMessage: getErrorMessage(e),
        });
      });
  }

  updateReportModel() {
    ReportModelApiService.update(
      this.state.currentReportModel.id,
      this.state.currentReportModel,
      this.source.token
    )
      .then(() => {
        this.props.onReportModelChange();
      })
      .catch((e) => {
        this.setState({
          errorMessage: getErrorMessage(e),
        });
      });
  }

  deleteReportModel() {
    ReportModelApiService.delete(
      this.state.currentReportModel.id,
      this.source.token
    )
      .then(() => {
        this.props.onReportModelChange();
      })
      .catch((e) => {
        this.setState({
          errorMessage: getErrorMessage(e),
        });
      });
  }

  validateReportModel() {
    let formWarnings = defaultFormWarnings;
    let valid = true;
    if (this.state.currentReportModel.name === '') {
      formWarnings.name = 'Veuillez indiquer un titre';
      valid = false;
    }
    if (this.state.currentReportModel.layer_id === '') {
      formWarnings.layer = 'Veuillez indiquer une couche';
      valid = false;
    }
    if (this.state.currentReportModel.custom_fields.length === 0) {
      formWarnings.fields = 'Veuillez ajouter au moins un champ';
      valid = false;
    }
    for (const f in this.state.currentReportModel.custom_fields) {
      if (this.state.currentReportModel.custom_fields[f].name === '') {
        formWarnings.fieldName[f] = 'obligatoire';
        valid = false;
      }
      if (this.state.currentReportModel.custom_fields[f].type === '') {
        formWarnings.fieldType[f] = 'obligatoire';
        valid = false;
      }
    }
    this.setState({
      formWarnings,
    });
    return valid;
  }

  render() {
    const { currentReportModel, formWarnings } = this.state;

    return (
      <div>
        {currentReportModel && (
          <div className="edit-form">
            <h4>Modèle de rapport</h4>
            <form>
              <div className="form-group">
                <label htmlFor="name">Titre*</label>
                <span style={{ color: 'red', float: 'right' }}>
                  {formWarnings['name']}
                </span>
                <input
                  required
                  type="text"
                  className="form-control"
                  id="name"
                  value={currentReportModel.name}
                  onChange={(e) => this.onChangeName(e)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="layer_id">Couche associée*</label>
                <span style={{ color: 'red', float: 'right' }}>
                  {formWarnings['layer']}
                </span>
                <input
                  type="text"
                  className="form-control"
                  id="layer_id"
                  value={currentReportModel.layer_id}
                  onChange={(e) => this.onChangeLayer(e)}
                />
              </div>

              <label htmlFor="custom_fields">Champs de formulaire</label>
              <span style={{ color: 'red', float: 'right' }}>
                {formWarnings['fields']}
              </span>
              <div id="custom_fields" className="form-group">
                {currentReportModel.custom_fields.length !== 0 ? (
                  currentReportModel.custom_fields.map((field, index) => (
                    <div key={index} className="row">
                      <div className="col-4">
                        <label htmlFor="field_name">Libellé*</label>
                        <input
                          type="text"
                          className="form-control mb-2"
                          value={field.name}
                          id="field_name"
                          onChange={(e) => this.onChangeField('name', index, e)}
                        />
                        {formWarnings['fieldName'] && (
                          <span style={{ color: 'red' }}>
                            {formWarnings['fieldName'][index]}
                          </span>
                        )}
                      </div>
                      <div className="col-4">
                        <label htmlFor="field_type">Type*</label>
                        <select
                          className="form-control mb-2"
                          value={field.type}
                          id="field_type"
                          onChange={(e) => this.onChangeField('type', index, e)}
                        >
                          <option value=""></option>
                          <option value="string">texte (simple)</option>
                          <option value="array-string">
                            texte (valeurs multiples)
                          </option>
                          <option value="number">numérique</option>
                          <option value="boolean">boolean</option>
                          <option value="date">date</option>
                          <option value="file">photo</option>
                        </select>
                        {formWarnings['fieldType'] && (
                          <span style={{ color: 'red' }}>
                            {formWarnings['fieldType'][index]}
                          </span>
                        )}
                      </div>
                      <div className="col-2">
                        <label htmlFor="field_required">Requis</label>
                        <input
                          className="form-check"
                          type="checkbox"
                          aria-label='field_required'
                          checked={field.required}
                          id="field_required"
                          onChange={(e) =>
                            this.onChangeField('required', index, e)
                          }
                        />
                      </div>
                      <div className="col-1">
                        <button
                          className="btn btn-danger mt-4"
                          onClick={(e) => this.deleteField(index, e)}
                        >
                          <FaMinus />
                        </button>
                      </div>
                      <div className="col-1">
                        {index ===
                          currentReportModel.custom_fields.length - 1 && (
                          <button
                            className="btn btn-success mt-4"
                            onClick={(e) => this.addField(e)}
                          >
                            <FaPlus />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <button
                    className="btn btn-success"
                    onClick={(e) => this.addField(e)}
                  >
                    <FaPlus />
                  </button>
                )}
              </div>
            </form>

            {currentReportModel.id && (
              <button
                className="btn btn-danger mr-2"
                onClick={() => {
                  if (
                    window.confirm(
                      'Veuillez confirmer la suppression du modèle de rapport'
                    )
                  )
                    this.deleteReportModel();
                }}
              >
                Supprimer
              </button>
            )}

            <button
              type="submit"
              className="btn btn-success mr-2"
              onClick={() => {
                if (window.confirm('Veuillez confirmer vos modifications'))
                  this.submitReportModel();
              }}
            >
              Sauvegarder
            </button>

            <button
              type="submit"
              className="btn btn-secondary mr-2"
              onClick={() => {
                this.props.onCancel();
              }}
            >
              Annuler
            </button>

            <p className="mt-2 text-danger">{this.state.errorMessage}</p>
          </div>
        )}
      </div>
    );
  }
}
